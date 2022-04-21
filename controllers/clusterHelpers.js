/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const ini = require("ini");
const AXIOS = require('axios');
const HTTPS = require('https');
const { getClusterMetrics } = require('./clusterMetricsHelpers');
const bcryptjs = require("bcryptjs");
const HttpError = require("../models/httpError");

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

async function hashPassword(password) {
  try {
    let hashed = await bcryptjs.hash(password, 10);
    let escapedHash = hashed.replace(/\$/g, "$$$$");
    return escapedHash
  } catch(err) {
    return err;
  }
}

async function setDomains(domainConfigs) {
  try {
    domainConfigs.password = await hashPassword(domainConfigs.password);
  } catch(err) {
    return err;
  }

  try {
    let playbook = new Ansible.Playbook().playbook('ansible/update_monitor_domains').variables({
      traefikHostName: domainConfigs.traefikHostName,
      prometheusHostName: domainConfigs.prometheusHostName,
      grafanaHostName: domainConfigs.grafanaHostName,
      escapedHash: domainConfigs.password
    });
    playbook.inventory('ansible/inventory/hosts');
    playbook.forks(1);
    playbook.on('stdout', function(data) { console.log(data.toString()); });
    playbook.on('stderr', function(data) { console.log(data.toString()); });
    let successResult = await playbook.exec();
    return successResult;
  } catch(err) {
    return err;
  }
}

module.exports = {
  setDomains,
  getManagerIP,
  createDockerAPIConnection
}