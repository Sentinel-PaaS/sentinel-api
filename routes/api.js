const express = require("express");
const app = require("..");
const router = express.Router();
const appsController = require('../controllers/apps');
const clusterController = require('../controllers/cluster');
const AXIOS = require('axios');
const { validateAuthToken } = require('../controllers/authenticate') //Needs to be added to each route as a middleware
const { validateProductionAppExists, validateCanaryAppExists, validateManagerExists } = require('../controllers/validate')

// Routes for apps controller
// Get list of all running apps
router.get('/apps', validateManagerExists, appsController.listServices);

// Inspect the status of a particular service
router.get('/apps/:appName', validateManagerExists, validateProductionAppExists, appsController.inspectService);

// Inspect the status of cluster nodes 
router.get('/cluster', validateManagerExists, clusterController.inspectNodes);

// Inspect the logs of a particular service
router.get('/apps/:appName/logs', validateManagerExists, appsController.getServiceLogs);

// get manager IP
router.get('/cluster/managerIP', validateManagerExists, clusterController.getManagerIP);

// Deploy a new app (if sql file provided, it will be uploaded first)
router.post('/apps', validateManagerExists, appsController.deploy);
router.post('/apps/:appName/upload', validateManagerExists, appsController.upload)

// Deploy a canary (currently works with just `/api/apps/randomApp/canary`)
router.post('/apps/:appName/canary', validateManagerExists, validateProductionAppExists, appsController.canaryDeploy);

// Change canary traffic splitting weights
router.put('/apps/:appName/canary', validateManagerExists, validateCanaryAppExists, appsController.adjustTraffic);

// Promote canary version
router.post('/apps/:appName/promote', validateManagerExists, validateCanaryAppExists, appsController.canaryPromote);

// Rollback canary
router.post('/apps/:appName/rollback', validateManagerExists, validateCanaryAppExists, appsController.canaryRollback);

// Delete application
router.delete('/apps/:appName', validateManagerExists, validateProductionAppExists, appsController.deleteApp);

// Scale application
router.put('/apps/:appName/scale', validateManagerExists, validateProductionAppExists, appsController.scale);

// Routes for cluster controller
// Initialize cluster
router.post('/cluster/initialize', clusterController.init);

// Scale cluster
router.put('/cluster/scale', validateManagerExists, clusterController.scale);

// Delete cluster
router.delete('/destroy', clusterController.destroy);

// Set dashboard domains and password
router.post('/cluster/monitor/domains', validateManagerExists, clusterController.setDomains);

module.exports = router;