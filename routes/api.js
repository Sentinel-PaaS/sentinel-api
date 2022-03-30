const express = require("express");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const appsController = require('../controllers/apps');
const clusterController = require('../controllers/cluster');

// Routes for apps controller
// Get list of all running apps
router.get('/apps', appsController.listServices);

// Inspect the status of a particular service
router.get('/apps/:appName', appsController.inspectService);

// Inspect the status of a particular service
router.get('/cluster', appsController.listNodes);

// Inspect the status of a particular service
router.get('/apps/:id/logs', appsController.getServiceLogs);

// Deploy a new app
router.post('/apps', upload.single('sqlFile'), appsController.deploy);

// Deploy a canary (currently works with just `/api/apps/randomApp/canary`)
router.post('/apps/:appName/canary', appsController.canaryDeploy);

// Change canary traffic splitting weights
router.put('/apps/:appName/canary', appsController.adjustTraffic);

// Promote canary version
router.post('/apps/:appName/promote', appsController.canaryPromote);

// Rollback canary
router.post('/apps/:appName/rollback', appsController.canaryRollback);

// Delete application
router.delete('/apps/:appName', appsController.deleteApp);

// Scale application
router.put('/apps/:appName/scale', appsController.scale);

// Routes for cluster controller
// Initialize cluster
router.post('/cluster/initialize', clusterController.init);

// Scale cluster
router.put('/cluster/scale', clusterController.scale);

// Delete cluster
router.delete('/destroy', clusterController.destroy);

module.exports = router;