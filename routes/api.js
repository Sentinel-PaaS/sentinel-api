const express = require("express");
const router = express.Router();
const Ansible = require("node-ansible");

// const path = require("path");

// Get list of all running apps
router.get('/apps', (req, res, next) => {
  let playbook = new Ansible.Playbook().playbook('ansible/get_apps');
  playbook.inventory('inventory/hosts');
  let promise = playbook.exec();
  promise.then((successResult) => {
    console.log(successResult.code); // Exit code of the executed command
    console.log("output: ", successResult.output); // Standard output/error of the executed command
  }).catch((error) => {
    console.error(error);
  });
});

module.exports = router;