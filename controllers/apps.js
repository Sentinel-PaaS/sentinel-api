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
  host: '54.226.61.129',
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

  async deploy(req, res, next) {
    let appName = req.body.appName;
    let appImage = req.body.appImage;
    let hostName = req.body.hostName;
    let databaseImage = req.body.databaseImage;

    if (databaseImage) {
      const networkOptions = {
        Name: "db_network",
        Driver: "overlay",
        Attachable: true
      };
      try {
        await manager1.createNetwork(networkOptions);
      } catch (err) {
        console.error(err);
      }
      deployDatabase(databaseImage); // this function still needs to be written
    }

    const serviceOptions = {
      Name: appName,
    };

    manager1.createService(serviceOptions);
  },
};