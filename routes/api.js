const express = require("express");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const appsController = require('../controllers/apps');

// Get list of all running apps
router.get('/apps', appsController.listServices);

// Inspect the status of a particular service
router.get('/apps/:appName', appsController.inspectService);

// Inspect the status of a particular service
router.get('/cluster', appsController.listNodes);

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