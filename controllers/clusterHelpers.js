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

module.exports = {
  getManagerIP,
  createDockerAPIConnection
}