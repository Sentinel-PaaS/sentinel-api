/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");
const AXIOS = require('axios');
const { compileFunction } = require("vm");
const { getClusterMetrics } = require('./cluster_metrics');

function pad(value) {
  value = String(value);
  if (value.length < 2) {
    return "0" + value;
  } else {
    return value;
  }
}

function timeStamp() {
  var date = new Date(Date.now());
  return `${+date.getDate()}/${+(date.getMonth()+1)}/${+date.getFullYear()}-${pad(+date.getHours())}:${pad(+date.getMinutes())}:${pad(+date.getSeconds())}`;
}

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

module.exports = {
  // https://docs.docker.com/engine/api/v1.37/#operation/ServiceLogs

  async getServiceLogs(req, res, next) {
    if (!fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
    const managerIP = getManagerIP();

    let serviceNameToLog = req.params.appName;

    try {
      let result = await AXIOS.get(`http://${managerIP}:2375/services`);
      let services = result.data;
      let justNamesAndIDs = services.map(record => {
        return {
          serviceName: record.Spec.Name,
          serviceID: record.ID,
        };
      });

      let idForLogs = justNamesAndIDs.filter(record => {
        console.log(record.serviceName, serviceNameToLog);
        return record.serviceName === serviceNameToLog;
      })[0].serviceID;

      let result2 = await AXIOS.get(`http://${managerIP}:2375/services/${idForLogs}/logs?stdout=true&stderr=true`);
      let logs = result2.data;
      res.send(logs);
    } catch(err) {
      console.log(err);
      res.send(err);
    }
  },

  listServices(req, res, next) {
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

      let regexForLastPart = /(_production|_canary)/
      let regexForFirstPart = /.*(?=_)/

      result = result.map(record => {
        if (regexForLastPart.test(record.serviceName)) {
          record.appName = record.serviceName.match(regexForFirstPart)[0]
        }
        return record;
      })

      res.send(result);
    }).catch(err => {
      console.error(err);
    });
  },

  async inspectService(req, res, next) {
    const managerIP = getManagerIP();
    let clusterMetrics;
    
    try {
      let nodeMetrics = await getClusterMetrics(managerIP);

      clusterMetrics = nodeMetrics;
    } catch (err) {
      console.log(err);
    }

    let serviceName = req.params.appName;
    let regex = /.*(?=[_-])/;
    // let serviceNameFirstPart = serviceName.match(regex)[0];

    try {
      let services = await AXIOS.get(`http://${managerIP}:2375/services`)
      services = services.data;
      services = services.filter(record => {
        let firstPart = record.Spec.Name.match(regex)[0];
        // return firstPart === serviceNameFirstPart;
        return firstPart === serviceName;
      });
      services = services.map(record => {
        return {
          serviceName: record.Spec.Name,
          serviceID: record.ID,
          serviceReplicas: record.Spec.Mode.Replicated ? record.Spec.Mode.Replicated.Replicas : 0,
          servicesTasks: []
        };
      });

      let tasks = await AXIOS.get(`http://${managerIP}:2375/tasks`);
      tasks = tasks.data;

      services.forEach(service => {
        tasks.forEach(task => {
          if (task.ServiceID === service.serviceID) {
            service.servicesTasks.push({
              taskStatus: task.Status.State,
              taskStatusTimestamp: task.Status.Timestamp,
              taskSlot: task.Slot,
              taskContainer: task.Status.ContainerStatus.ContainerID,
              taskNodeID: task.NodeID
            });
          };
        });
      });

      services.forEach(service => {
        service.servicesTasks.sort((a, b) => {
          if (a.taskStatusTimestamp < b.taskStatusTimestamp) {
            return 1
          } else if (a.taskStatusTimestamp > b.taskStatusTimestamp) {
            return -1
          } else {
            return 0
          }
        })
      });

      console.log("THE METRICS: ", clusterMetrics)
      services.forEach(service => {
        service.servicesTasks = service.servicesTasks.slice(0, service.serviceReplicas);
        service.servicesTasks.forEach(task => {
          clusterMetrics.forEach(metric => {
            if (task.taskNodeID === metric.NodeID) {
              task.hostNodeMetrics = {
                diskSpace: metric.DiskSpace,
                memorySpace: metric.MemorySpace,
                cpuUsageAvgLast10Minutes: metric.cpuUsageAvgLast10Minutes
              }
            }
          })
          task.taskStatusTimestamp = timeStamp(task.taskStatusTimestamp);
          delete task.taskNodeID;
          delete task.taskContainer;
        })
          delete service.serviceID;
      })

      

      let result = services;

      // let anyNotRunning = false;
      // result.forEach(service => {
      //   service.servicesTasks.forEach(task => {
      //     if (task.taskStatus !== "running") {
      //       anyNotRunning = true;
      //     }
      //   })
      // });

      let message = "For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.";
      let hasCanary = result.length > 1 ? true : false;
//       if (result.length > 1) {
//         if (anyNotRunning) {
//           message = `This service has a canary version, and there may be a problem with either an instance of the canary version, or the production version. See "taskStatus" details below.

// For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.`;
//         } else {
//           message = `This service has a canary version, and all instances of canary and production appear to be running. See "taskStatus" details below.

// For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.`;
//         }
//       } else {
//         if (anyNotRunning) {
//           message = `This service has no canary version, but there may be a problem with the production version. See "taskStatus" details below.

// For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS.. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.`;
//         } else {
//           message = `This service has no canary version, and all instances appear to be running. See "taskStatus" details below.

// For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.`;
//         }
//       }



      let response = {
        hasCanary,
        message,
        data: result
      };
      res.send(response);
    } catch (err) {
      console.error(err);
    }
  },

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