/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");
const AXIOS = require('axios');
const { compileFunction } = require("vm");
const { getClusterMetrics } = require('./clusterMetricsHelpers');
const HttpError = require("../models/httpError");
const { 
  getManagerIP,
  createDockerAPIConnection,
  getIDForAppName,
  appendAppNames,
  combineServicesWithTheirTasks,
  onlyMostRecentServiceTasks, 
  combineTasksWithNodeMetrics,
  removeExtraneousProperties,
  filterForDesiredService,
  checkForCanary } = require("./appsHelpers");

async function getServiceLogs(req, res, next) {
  const managerIP = getManagerIP();

  try {
    let serviceNameToLog = req.params.appName;
    let idForLogs = await getIDForAppName(serviceNameToLog, managerIP);

    let result = await AXIOS.get(`http://${managerIP}:2375/services/${idForLogs}/logs?stdout=true&stderr=true`);
    let logs = result.data;
    res.send(logs);
  } catch(err) {
    console.log(err);
    next(new HttpError("Unable to get logs", 404));
  }
}

function listServices(req, res, next) {
  const managerIP = getManagerIP();

  let result = AXIOS.get(`http://${managerIP}:2375/services`);
  result.then(success => {
    result = success.data;
    result = result.map(record => {
      return {
        serviceName: record.Spec.Name,
        serviceID: record.ID,
      };
    });

    result = appendAppNames(result);

    res.send(result);
  }).catch(err => {
    console.log(err);
    next(new HttpError("Error getting inventory", 404));
  });
}

async function inspectService(req, res, next) {
  let serviceName = req.params.appName;
  const managerIP = getManagerIP();
  let nodeMetrics;
  let tasks;
  
  try {
    nodeMetrics = await getClusterMetrics(managerIP);
  } catch (err) {
    next(new HttpError("Unable to get details for this service", 404));
  }

  try {
    tasks = await AXIOS.get(`http://${managerIP}:2375/tasks`);
    tasks = tasks.data;
  } catch (err) {
    console.log(err);
    next(new HttpError("Unable to get details for this service", 404));
  }

  try {
    let services = await AXIOS.get(`http://${managerIP}:2375/services`)
    services = services.data;

    let singleService = filterForDesiredService(services, serviceName);
    combineServicesWithTheirTasks(singleService, tasks);
    singleService.forEach(service => {
      combineTasksWithNodeMetrics(service.serviceTasks, nodeMetrics)
    });
    onlyMostRecentServiceTasks(singleService);
    removeExtraneousProperties(singleService);

    let hasCanary = checkForCanary(singleService);
    let message = "For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.";

    let response = {
      hasCanary,
      message,
      data: singleService
    };
    res.send(response);
  } catch (err) {
    console.log(err);
    next(new HttpError("Unable to get details for this service", 404));
  }
}

module.exports = {
  getServiceLogs,
  listServices,
  inspectService,

  async canaryDeploy(req, res, next) {
    const appName = req.params.appName;
    const productionImagePath = req.body.productionImagePath;
    const hostname = req.body.hostname;
    const productionPort = req.body.productionPort;
    const canaryImagePath = req.body.canaryImagePath;
    const canaryPort = req.body.canaryPort;
    let canaryWeight = parseInt(req.body.canaryWeight, 10);
    if (Number.isNaN(canaryWeight) || canaryWeight > 100 || canaryWeight < 0) {
      res.status(400).send("Must send an integer value 0-100 for canary traffic percentage.");
    }
    canaryWeight = Math.round(canaryWeight / 10);
    const productionWeight = 10 - canaryWeight;
    const appHasDatabase = req.body.appHasDatabase;
    const dbUsername = req.body.dbUsername;
    const dbPassword = req.body.dbPassword;
    const dbName = req.body.dbName;
    const dbHost = req.body.dbHost;
    const isSticky = req.body.isSticky;
    const sticky = isSticky ? "_sticky" : "";

    const manager = createDockerAPIConnection();
    const productionService = manager.getService(`${appName}_production`);
    const productionServiceInspected = await productionService.inspect();
    const scaleNumber = parseInt(productionServiceInspected.Spec.Mode.Replicated.Replicas, 10);

    let playbook;
    if (appHasDatabase) {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_canary_with_db').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
        canaryImagePath,
        canaryPort,
        canaryWeight,
        productionWeight,
        dbUsername,
        dbPassword,
        dbName,
        dbHost,
        scaleNumber,
        sticky,
      });
    } else {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_canary_no_db').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
        canaryImagePath,
        canaryPort,
        canaryWeight,
        productionWeight,
        scaleNumber,
        sticky,
      });
    }
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Canary deployed.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async upload(req, res, next) {
    if (!req.files) {
      res.status(400).send('No file uploaded');
    } else {
      let dbFile = req.files.app_db;

      dbFile.mv(__dirname + '/../assets/sql/' + req.params.appName + '_db.sql');
      res.status(200).send('File Uploaded');
    }
  },

  async deploy(req, res, next) {
    const appName = req.body.appName;
    const productionImagePath = req.body.productionImagePath;
    const hostname = req.body.hostname;
    const productionPort = req.body.productionPort;
    const appHasDatabase = req.body.appHasDatabase;
    const dbUsername = req.body.dbUsername;
    const dbPassword = req.body.dbPassword;
    const dbHost = req.body.dbHost;
    const dbName = req.body.dbName;
    const dbCreateSchemaOnDeploy = req.body.dbCreateSchemaOnDeploy;

    let playbook;
    if (appHasDatabase && !dbCreateSchemaOnDeploy) {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_production_with_db').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
        dbUsername,
        dbPassword,
        dbHost,
        dbName,
      });
    } else if (appHasDatabase && dbCreateSchemaOnDeploy) {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_production_with_db_sql').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
        dbUsername,
        dbPassword,
        dbHost,
        dbName,
      });
    } else {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_production_no_db').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
      });
    }
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("App deployed.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async adjustTraffic(req, res, next) {
    const appName = req.params.appName;
    let canaryWeight = parseInt(req.body.newWeight, 10);
    if (Number.isNaN(canaryWeight) || canaryWeight > 100 || canaryWeight < 0) {
      res.status(400).send("Must send an integer value 0-100 for canary traffic percentage.");
    }
    canaryWeight = Math.round(canaryWeight / 10);
    const productionWeight = 10 - canaryWeight;

    let playbook = new Ansible.Playbook().playbook('ansible/adjust_traffic').variables({
      appName,
      canaryWeight,
      productionWeight,
    });
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Traffic adjusted.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async canaryPromote(req, res, next) {
    let appName = req.params.appName;
    let manager = createDockerAPIConnection();
    let canaryService = manager.getService(`${appName}_canary`);
    let canaryServiceInspected = await canaryService.inspect();
    let updateImage = canaryServiceInspected.Spec.Labels["com.docker.stack.image"];

    let playbook = new Ansible.Playbook().playbook('ansible/promote_canary').variables({
      appName,
      updateImage
    });
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Canary promoted.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async canaryRollback(req, res, next) {
    let appName = req.params.appName;

    let playbook = new Ansible.Playbook().playbook('ansible/rollback_canary').variables({
      appName,
    });
    playbook.inventory('ansible/inventory/hosts');    //
    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Rollback complete.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async deleteApp(req, res, next) {
    let appName = req.params.appName;
    let playbook = new Ansible.Playbook().playbook('ansible/delete_app').variables({
      appName,
    });
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("App deleted.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  async scale(req, res, next) {
    let appName = req.params.appName;
    let scaleNumber = req.body.scaleNumber;
    let playbook = new Ansible.Playbook().playbook('ansible/scale_app').variables({
      appName,
      scaleNumber
    });
    playbook.inventory('ansible/inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send(`${appName} app scaled to ${scaleNumber} containers.`);
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

};