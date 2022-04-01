const express = require("express");
const app = require("..");
const router = express.Router();
const appsController = require('../controllers/apps');
const clusterController = require('../controllers/cluster');
const AXIOS = require('axios');
const { validateAuthToken } = require('../controllers/authenticate') //Needs to be added to each route as a middleware
const { validateProductionAppExists, validateCanaryAppExists } = require('../controllers/validate_app')

// Routes for apps controller
// Get list of all running apps
router.get('/apps', appsController.listServices);

// Inspect the status of a particular service
router.get('/apps/:appName', appsController.inspectService);

// Inspect the status of a particular service
router.get('/cluster', clusterController.inspectNodes);

// Inspect the status of a particular service
router.get('/apps/:appName/logs', appsController.getServiceLogs);

// Deploy a new app (if sql file provided, it will be uploaded first)
router.post('/apps', appsController.deploy);
router.post('/apps/:appName/upload', appsController.upload)

// Deploy a canary (currently works with just `/api/apps/randomApp/canary`)
router.post('/apps/:appName/canary', validateProductionAppExists, appsController.canaryDeploy);

// Change canary traffic splitting weights
router.put('/apps/:appName/canary', validateCanaryAppExists, appsController.adjustTraffic);

// Promote canary version
router.post('/apps/:appName/promote', validateCanaryAppExists, appsController.canaryPromote);

// Rollback canary
router.post('/apps/:appName/rollback', validateCanaryAppExists, appsController.canaryRollback);

// Delete application
router.delete('/apps/:appName', validateProductionAppExists, appsController.deleteApp);

// Scale application
router.put('/apps/:appName/scale', validateProductionAppExists, appsController.scale);

// Routes for cluster controller
// Initialize cluster
router.post('/cluster/initialize', clusterController.init);

// Scale cluster
router.put('/cluster/scale', clusterController.scale);

// Delete cluster
router.delete('/destroy', clusterController.destroy);

router.post('/cluster/monitor/domains', clusterController.setDomains);

module.exports = router;