const express = require("express");
const router = express.Router();
const appsController = require('../controllers/apps');
const clusterController = require('../controllers/cluster');

// Routes for apps controller
// Get list of all running apps
router.get('/apps', appsController.list);

// Deploy a new app
router.post('/apps', appsController.deploy);

// Deploy a canary
router.post('/apps/:appName/canary', appsController.canaryDeploy);

// Change canary traffic splitting weights
router.put('/apps/:appName/canary', appsController.adjustTraffic);

// Promote canary version
router.post('/apps/:appName/promote', appsController.canaryPromote);

// Rollback canary
router.post('/apps/:appName/rollback', appsController.canaryRollback);

// Delete application
router.delete('/apps/:appName', appsController.deleteApp);

// Routes for cluster controller
// Initialize cluster
router.post('/cluster/initialize', clusterController.init);

// Scale cluster
router.put('/cluster/scale', clusterController.scale);

// Delete cluster
router.delete('/destroy', clusterController.destroy);

  // let playbook = new Ansible.Playbook().playbook('ansible/get_apps');
  // playbook.inventory('inventory/hosts');
  // let arr = [];
  // playbook.on('stdout', function(data) {
  //   arr.push(data.toString());
  // });
  // let promise = playbook.exec();
  // promise.then((successResult) => {
  //   console.log(successResult);
  //   console.log(successResult.code); // Exit code of the executed command
  //   console.log(successResult.output); // Standard output/error of the executed command
  //   console.log(arr);
  // }).catch((error) => {
  //   console.error(error);
  // });

module.exports = router;