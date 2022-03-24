const express = require("express");
const router = express.Router();
const appsController = require('../controllers/apps');

// Get list of all running apps
router.get('/apps', appsController.list);

// Deploy a new app
router.post('/apps', appsController.deploy);

// Deploy a canary
router.post('/apps/canary/deploy', appsController.canaryDeploy);

// Change canary traffic splitting weights
router.post('/apps/canary/traffic', appsController.adjustTraffic);

// Promote canary version
router.post('/apps/canary/promote', appsController.canaryPromote);

// Rollback canary
router.post('/apps/canary/rollback', appsController.canaryRollback);

// Delete application
router.delete('/apps/:appName', appsController.deleteApp);

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