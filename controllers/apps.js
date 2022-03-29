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

const managerIP = getManagerIP();

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
    let serviceID = req.params.id;
    let result = AXIOS.get(`http://${managerIP}:2375/services/${serviceID}/logs?stdout=true&stderr=true`);
    result.then(success => {
      res.send(success.data);
    }).catch(err => {
      console.log(err)
    })
  },

  listServices(req, res, next) {

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
    // let appName = req.params.appName

    let productionImageNameValue = "mfatigati/docker-simple-amd";
    let hostNameValue = "hello-canary-1.michaelfatigati.com";
    let appNameValue = "hello-simple";
    let productionPortValue = 3000;
    let canaryImageNameValue = "mfatigati/docker-canary-amd";
    let canaryPortValue = 3000;

    let playbook = new Ansible.Playbook().playbook('ansible/deploy_canary').variables({
      productionImageName: productionImageNameValue,
      hostName: hostNameValue,
      appName: appNameValue,
      productionPort: productionPortValue,
      canaryImageName: canaryImageNameValue,
      canaryPort: canaryPortValue
    });
    playbook.inventory('inventory/hosts');

    let promise = playbook.exec();
    // console.log(successResult);
    promise.then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.send("okay");
    }).catch((error) => {
      console.error(error);
    });
  },

  async deploy(req, res, next) {
    // let appName = req.body.appName;
    // let appImage = req.body.appImage;
    // let hostName = req.body.hostName;
    // let databaseImage = req.body.databaseImage;

    let productionImageNameValue = "mfatigati/docker-simple-amd";
    let hostNameValue = "hello-canary-1.michaelfatigati.com";
    let appNameValue = "hello-simple";
    let productionPortValue = 3000;

    let playbook = new Ansible.Playbook().playbook('ansible/deploy_production').variables({
      productionImageName: productionImageNameValue,
      hostName: hostNameValue,
      appName: appNameValue,
      productionPort: productionPortValue
    });
    playbook.inventory('inventory/hosts');

    let promise = playbook.exec();
    // console.log(successResult);
    promise.then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.send("okay");
    }).catch((error) => {
      console.error(error);
    });

    // if (databaseImage) {
    //   const networkOptions = {
    //     Name: "db_network",
    //     Driver: "overlay",
    //     Attachable: true
    //   };
    //   try {
    //     await manager1.createNetwork(networkOptions);
    //   } catch (err) {
    //     console.error(err);
    //   }
    //   deployDatabase(databaseImage); // this function still needs to be written
    // }

    // const serviceOptions = {
    //   Name: appName,
    // };

    // manager1.createService(serviceOptions);
  },

  async adjustTraffic(req, res, next) {
    let appName = req.params.appName;
    let canaryWeight = parseInt(req.body.newWeight, 10);
    let productionWeight = 100 - canaryWeight;

    let playbook = new Ansible.Playbook().playbook('ansible/adjust_traffic').variables({
      appName,
      canaryWeight,
      productionWeight,
    });
    playbook.inventory('inventory/hosts');

    await playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("traffic adjusted");
    }).catch((error) => {
      console.error(error);
    });
  },

  async canaryPromote(req, res, next) {
    let appName = req.params.appName;
    let services = await manager1.listServices();
    console.log(services);
    // let canaryImage = services.
  },

  async canaryRollback(req, res, next) {
    let appName = req.params.appName;

    let playbook = new Ansible.Playbook().playbook('ansible/rollback_canary').variables({
      appName,
    });
    playbook.inventory('inventory/hosts');

    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("rollback complete");
    }).catch((error) => {
      console.error(error);
    });
  },

  async deleteApp(req, res, next) {
    let appName = req.params.appName;

    let playbook = new Ansible.Playbook().playbook('ansible/delete_app').variables({
      appName,
    });
    playbook.inventory('inventory/hosts');

    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("app deleted");
    }).catch((error) => {
      console.error(error);
    });
  },

};