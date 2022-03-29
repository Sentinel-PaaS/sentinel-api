/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");

function getManagerIP() {
  const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
  return Object.keys(hosts.managers)[0].split(' ')[0];
}

function createDockerAPIConnection() {
  const managerIP = getManagerIP();

  return new Docker({
    host: managerIP,
    port: process.env.DOCKER_PORT || 2375,
    // ca: fs.readFileSync('ca.pem'),
    // cert: fs.readFileSync('cert.pem'),
    // key: fs.readFileSync('~/ssh-keys/ec2-docker.pem'),
    version: 'v1.25' // required when Docker >= v1.13, https://docs.docker.com/engine/api/version-history/
  });
}

function getServices() {
  const manager1 = createDockerAPIConnection();

  return new Promise((resolve, reject) => {
    manager1.listServices().then(success => {
      return success;
    }).catch(err => reject(err));
  });
}

module.exports = {
  list(req, res, next) {
    if (fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
    const manager1 = createDockerAPIConnection();

    manager1.listServices().then((successResult) => {
      console.log(successResult);
      successResult = successResult.map(record => {
        return {
          serviceName: record.Spec.Name,
          serviceID: record.ID,
        };
      });
      res.status(200).json(successResult);
    }).catch((error) => {
      console.error(error);
      res.status(500).json({ error });
    });
  },

  async inspect(req, res, next) {
    if (fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
    const manager1 = createDockerAPIConnection();

    // use listServices to get container ids, as well as whether there is a canary
    // use listContainers to get health of the containers

    let serviceName = req.params.appName;
    let regex = /.*(?=_)/;

    // get the part of the name prior to "_production", to match this against any canaries
    let serviceNameFirstPart = serviceName.match(regex)[0];
    let services = await manager1.listServices();

    services = services.filter(record => {
      let firstPart = record.Spec.Name.match(regex)[0];
      return firstPart === serviceNameFirstPart;
    });
    services = services.map(record => {
      return {
        serviceName: record.Spec.Name,
        serviceID: record.ID,
        serviceReplicas: record.Spec.Mode.Replicated.Replicas
      };
    });

    let containers = await manager1.listContainers();

    services.forEach(service => {
      containers.forEach(record => {
        if (record.Labels['com.docker.swarm.service.id'] === service.serviceID) {
          service.serviceState = `${record.State}: ${record.Status}`;
        }
      });
    });
    console.log(services);
    res.json(services);
  },

  async canaryDeploy(req, res, next) {
    const appName = req.params.appName;
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    const productionImagePath = req.body.productionImagePath;
    const hostname = req.body.hostname;
    const productionPort = req.body.productionPort;
    const canaryImagePath = req.body.canaryImagePath;
    const canaryPort = req.body.canaryPort;
    const canaryWeight = parseInt(req.body.newWeight, 10);
    if (Number.isNaN(canaryWeight) || canaryWeight > 100 || canaryWeight < 0) {
      res.status(400).send("Must send an integer value 0-100 for canary traffic percentage.");
    }
    const productionWeight = 100 - canaryWeight;
    const appHasDatabase = req.body.appHasDatabase;
    const dbUsername = req.body.dbUsername;
    const dbPassword = req.body.dbPassword;

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
      });
    }
    playbook.inventory('inventory/hosts');

    let promise = playbook.exec();
    promise.then((successResult) => {
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
      res.status(400).send('No file uploaded')
    } else {
      let dbFile = req.files.app_db

      dbFile.mv(__dirname + '/../assets/sql/' + req.params.appName + '_db.sql')
      res.status(200).send('File Uploaded')
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
    playbook.inventory('inventory/hosts');

    let promise = playbook.exec();
    promise.then((successResult) => {
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
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    const canaryWeight = parseInt(req.body.newWeight, 10);
    if (Number.isNaN(canaryWeight) || canaryWeight > 100 || canaryWeight < 0) {
      res.status(400).send("Must send an integer value 0-100 for canary traffic percentage.");
    }
    const productionWeight = 100 - canaryWeight;

    let playbook = new Ansible.Playbook().playbook('ansible/adjust_traffic').variables({
      appName,
      canaryWeight,
      productionWeight,
    });
    playbook.inventory('inventory/hosts');

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
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let services = await manager1.listServices();
    console.log(services);
    // let canaryImage = services.
  },

  async canaryRollback(req, res, next) {
    let appName = req.params.appName;
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let playbook = new Ansible.Playbook().playbook('ansible/rollback_canary').variables({
      appName,
    });
    playbook.inventory('inventory/hosts');

    playbook.exec().then((successResult) => {
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
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let playbook = new Ansible.Playbook().playbook('ansible/delete_app').variables({
      appName,
    });
    playbook.inventory('inventory/hosts');

    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("App deleted.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

};