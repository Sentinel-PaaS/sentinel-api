const fs = require('fs');
const ini = require('ini');
const Docker = require('dockerode');

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
  async validateProductionAppExists(req, res, next) {
    const appName = req.params.appName;
    if (fs.existsSync('../ansible/inventory/hosts')) {
      res.status(404).send("Manager node does not exist.");
    }

    const manager1 = createDockerAPIConnection();
    let services = await manager1.listServices();
    services = services.filter(record => {
      if (record.Spec.Name.match(appName + '_production')) {
        return record
      }
    });
    if (services.length === 0) {
      res.status(404).send("Application does not exist.");
    } else {
      next()
    }
  },
  async validateCanaryAppExists(req, res, next) {
    const appName = req.params.appName;

    if (fs.existsSync('../ansible/inventory/hosts')) {
      res.status(404).send("Manager node does not exist.");
    }

    const manager1 = createDockerAPIConnection();
    let services = await manager1.listServices();
    services = services.filter(record => {
      if (record.Spec.Name.match(appName + '_canary')) {
        return record
      }
    });

    if (services.length === 0) {
      res.status(404).send("Canary does not exist for this application.");
    } else {
      next();
    }
  }
}