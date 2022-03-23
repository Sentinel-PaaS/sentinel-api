/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");

const hosts = ini.parse(fs.readFileSync('./inventory/hosts', 'utf-8'));
console.log(hosts);

// function createNewDocker(hostAddress) {
//   return new Docker({
//     host: hostAddress,
//     port: process.env.DOCKER_PORT || 2375,
//     // ca: fs.readFileSync('ca.pem'),
//     // cert: fs.readFileSync('cert.pem'),
//     // key: fs.readFileSync('~/ssh-keys/ec2-docker.pem'),
//     version: 'v1.25' // required when Docker >= v1.13, https://docs.docker.com/engine/api/version-history/
//   });
// }
// let managerNodes = [];

const manager1 = new Docker({
  host: '13.58.254.199',
  port: process.env.DOCKER_PORT || 2375,
  // ca: fs.readFileSync('ca.pem'),
  // cert: fs.readFileSync('cert.pem'),
  // key: fs.readFileSync('~/ssh-keys/ec2-docker.pem'),
  version: 'v1.25' // required when Docker >= v1.13, https://docs.docker.com/engine/api/version-history/
});

module.exports = {
  list(req, res, next) {
    manager1.listServices().then((successResult) => {
      console.log(successResult);
      res.status(200).json(successResult);
    }).catch((error) => {
      console.error(error);
      res.status(500).json({ error });
    });
  },

  async canaryDeploy(req, res, next) {
    let productionImageNameValue = "mfatigati/docker-simple-amd";
    let hostNameValue = "canary.michaelfatigati.com";
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
    let hostNameValue = "canary.michaelfatigati.com";
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
};