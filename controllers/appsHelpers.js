/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const fs = require('fs');
const ini = require('ini');
// const path = require("path");
const AXIOS = require('axios');
const { compileFunction } = require("vm");
const clusterMetricsHelpers = require('./clusterMetricsHelpers');
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

function convertJSONTimeStamp(jsonDateTimeString) {
  var date = new Date(jsonDateTimeString);
  return `${+date.getDate()}/${+(date.getMonth()+1)}/${+date.getFullYear()}-${pad(+date.getHours())}:${pad(+date.getMinutes())}:${pad(+date.getSeconds())}`;
}

async function getIDForAppName(appName, managerIP) {
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
      return record.serviceName === appName;
    })[0].serviceID;

    return idForLogs;
  } catch(err) {
    return err;
  }
}

function appendAppNames(serviceArray) {
  let regexForLastPart = /(_production|_canary)/
  let regexForFirstPart = /.*(?=_)/

  let result = serviceArray.map(record => {
    if (regexForLastPart.test(record.serviceName)) {
      record.appName = record.serviceName.match(regexForFirstPart)[0]
    }
  return record;
})
  return result;
}

function combineServicesWithTheirTasks(servicesArray, tasksArray) {
  servicesArray.forEach(service => {
    tasksArray.forEach(task => {
      if (task.ServiceID === service.serviceID) {
        service.serviceTasks.push({
          taskStatus: task.Status.State,
          taskStatusTimestamp: task.Status.Timestamp,
          taskSlot: task.Slot,
          taskContainer: task.Status.ContainerStatus.ContainerID,
          taskNodeID: task.NodeID
        });
      };
    });
  });
}

function onlyMostRecentServiceTasks(servicesArray) {
  servicesArray.forEach(service => {
    service.serviceTasks.sort((a, b) => {
      if (a.taskStatusTimestamp < b.taskStatusTimestamp) {
        return 1
      } else if (a.taskStatusTimestamp > b.taskStatusTimestamp) {
        return -1
      } else {
        return 0
      }
    })
    service.serviceTasks = service.serviceTasks.slice(0, service.serviceReplicas);
  });
}

function combineTasksWithNodeMetrics(tasksArray, nodeMetricsArray) {
  tasksArray.forEach(task => {
    nodeMetricsArray.forEach(metric => {
      if (task.taskNodeID === metric.NodeID) {
        task.hostNodeMetrics = {
          diskSpace: metric.DiskSpace,
          memorySpace: metric.MemorySpace,
          cpuUsageAvgLast10Minutes: metric.cpuUsageAvgLast10Minutes
        }
      }
    })
  })
}

function removeExtraneousProperties(servicesArray) {
  servicesArray.forEach(service => {
    service.serviceTasks.forEach(task => {
      task.taskStatusTimestamp = convertJSONTimeStamp(task.taskStatusTimestamp);
      delete task.taskNodeID;
      delete task.taskContainer;
    })
      delete service.serviceID;
  })
}

function filterForDesiredService(servicesArray, serviceName) {
  let regex = /.*(?=[_-])/;
  let singleServiceArray = servicesArray.filter(record => {
    let firstPart = record.Spec.Name.match(regex)[0];
    return firstPart === serviceName;
  });
  singleServiceArray = singleServiceArray.map(record => {
    return {
      serviceName: record.Spec.Name,
      serviceID: record.ID,
      serviceReplicas: record.Spec.Mode.Replicated ? record.Spec.Mode.Replicated.Replicas : 0,
      serviceTasks: []
    };
  });
  return singleServiceArray;
}

function checkForCanary(singleServiceArray) {
  let regexCanary = /_canary/;
  let justNames = singleServiceArray.map(record => {
    return record.serviceName;
  })
  return singleServiceArray.length > 1 && justNames.some(element => regexCanary.test(element)) ? true : false;
}

async function getServicesList() {
  const managerIP = getManagerIP();
  try {
    let result = await AXIOS.get(`http://${managerIP}:2375/services`);
    //console.log(result);
    result = result.data;
    result = result.map(record => {
      return {
        serviceName: record.Spec.Name,
        serviceID: record.ID,
      };
    });

    result = appendAppNames(result);
    return result;
  } catch(err) {
    return err
  }
}

async function getServiceInfo(serviceName) {
  const managerIP = getManagerIP();
  let nodeMetrics;
  let tasks;
  
  try {
    nodeMetrics = await clusterMetricsHelpers.getClusterMetrics(managerIP);
  } catch (err) {
    return new HttpError("Unable to get details for this service", 404);
  }

  try {
    tasks = await AXIOS.get(`http://${managerIP}:2375/tasks`);
    tasks = tasks.data;
  } catch (err) {
    console.log(err);
    return new HttpError("Unable to get details for this service", 404);
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
    return response;
  } catch(err) {
    return err;
  }
}

async function getServiceLogs(serviceNameToLog) {
  const managerIP = getManagerIP();
  try {
    let idForLogs = await getIDForAppName(serviceNameToLog, managerIP);
    var config = {
      responseType: 'text',
      responseType: 'arraybuffer',
    responseEncoding: 'binary'
    };
    let result = await AXIOS.get(`http://${managerIP}:2375/services/${idForLogs}/logs?stdout=true&stderr=true`, config);
    //let logs = result.data;
    let logs = result.data.toString();
    //let logs = result.data.filter(byte => byte !== 01 && byte !== 00).toString();
    //console.log(logs);
    return logs;
  } catch(err) {
    return err;
  }
}

module.exports = {
  pad,
  timeStamp,
  getIDForAppName,
  appendAppNames,
  combineServicesWithTheirTasks,
  onlyMostRecentServiceTasks,
  combineTasksWithNodeMetrics,
  removeExtraneousProperties,
  filterForDesiredService,
  checkForCanary,
  getManagerIP,
  createDockerAPIConnection,
  getServicesList,
  getServiceInfo,
  getServiceLogs
}