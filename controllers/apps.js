/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");
const AXIOS = require('axios');

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
  getServiceLogs(req, res, next) {
    if (fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
    const managerIP = getManagerIP();

    let serviceID = req.params.id;
    let result = AXIOS.get(`http://${managerIP}:2375/services/${serviceID}/logs?stdout=true&stderr=true`);
    result.then(success => {
      res.send(success.data);
    }).catch(err => {
      console.log(err)
    })
  },

  listServices(req, res, next) {
    if (fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
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
      res.send(result);
    }).catch(err => {
      console.log(err)
    })
  },

  async inspectService(req, res, next) {
    if (fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }
    const managerIP = getManagerIP();

    let serviceName = req.params.appName;
    let regex = /.*(?=_)/;
    let serviceNameFirstPart = serviceName.match(regex)[0];

    try {
      let services = await AXIOS.get(`http://${managerIP}:2375/services`)
      services = services.data;
      services = services.filter(record => {
        let firstPart = record.Spec.Name.match(regex)[0];
        return firstPart === serviceNameFirstPart;
      });
      services = services.map(record => {
        return {
          serviceName: record.Spec.Name,
          serviceID: record.ID,
          serviceReplicas: record.Spec.Mode.Replicated.Replicas,
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
              taskContainer: task.Status.ContainerStatus.ContainerID
            })
          }
        })
      });
      
      let result = services;
      res.send(result);
    } catch(err) {
      console.log(err)
    }

  },

  async listNodes(req, res, next) {
    if (fs.existsSync('../ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }

    const manager1 = createDockerAPIConnection();

    try {
      // let nodes = await manager1.listNodes();
      let nodes = await manager1.listNodes();
      nodes = nodes.map(node => {
        return {
          Role: node.Spec.Role,
          Availability: node.Spec.Availability,
          // InternalAddr: node.Status.Addr
        }
      })
      let data = await AXIOS.get(`https://prometheus-2.michaelfatigati.com/api/v1/`, {
        query: "node_filesystem_size_bytes"
      });
      console.log(data.data);

      res.json(nodes);
    } catch(err) {
      console.log(err);
    }
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

  async deploy(req, res, next) {
    const appName = req.body.appName;
    const productionImagePath = req.body.productionImagePath;
    const hostname = req.body.hostname;
    const productionPort = req.body.productionPort;
    const appHasDatabase = req.body.appHasDatabase;
    const dbUsername = req.body.dbUsername;
    const dbPassword = req.body.dbPassword;
    const dbCreateSchemaOnDeploy = req.body.dbCreateSchemaOnDeploy;
    const sqlFile = req.file;

    let playbook;
    if (appHasDatabase) {
      playbook = new Ansible.Playbook().playbook('ansible/deploy_production_with_db').variables({
        appName,
        productionImagePath,
        hostname,
        productionPort,
        dbUsername,
        dbPassword,
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
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let services = await manager1.listServices();
    console.log(services);
    // let canaryImage = services.
  },

  canaryRollback(req, res, next) {
    let appName = req.params.appName;
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let playbook = new Ansible.Playbook().playbook('ansible/rollback_canary').variables({
      appName,
    });
    playbook.inventory('ansible/inventory/hosts');

    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Rollback complete.");
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Something went wrong.");
    });
  },

  deleteApp(req, res, next) {
    let appName = req.params.appName;
    // TODO: Add check for app's existence, respond with 400 if it doesn't exist

    let playbook = new Ansible.Playbook().playbook('ansible/delete_app').variables({
      appName,
    });
    playbook.inventory('ansible/inventory/hosts');

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