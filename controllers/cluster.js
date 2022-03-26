/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const { spawn } = require("child_process");

// Initialize Terraform
function initializeTerraform(req, res, next) {
  const terraformInit = spawn("sudo", ["terraform", "-chdir=./terraform", "init", "-input=false"]);
  terraformInit.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
  });

  terraformInit.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
  });

  terraformInit.on('error', (error) => {
    console.log(`error: ${error.message}`);
    res.status(500).send(`error: ${error}`);
  });

  terraformInit.on("close", code => {
    console.log(`child process exited with code ${code}`);
    applyTerraform(req, res, next);
  });
}

// Launch initial infrastructure
function applyTerraform(req, res, next) {
  const terraformApply = spawn("sudo", ["terraform", "-chdir=./terraform", "apply", "-input=false", "-auto-approve"]);
  terraformApply.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
  });

  terraformApply.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
  });

  terraformApply.on('error', (error) => {
    console.log(`error: ${error.message}`);
    res.status(500).send(`error: ${error}`);
  });

  terraformApply.on("close", code => {
    console.log(`child process exited with code ${code}`);
    finishConfiguration(req, res, next);
  });
}

// Complete configuration (install docker, initialize swarm, launch Traefik)
function finishConfiguration(req, res, next) {
  let playbook = new Ansible.Playbook().playbook('ansible/playbook');
  playbook.inventory('ansible/inventory/hosts');
  playbook.forks(1);
  playbook.on('stdout', function(data) { console.log(data.toString()); });
  playbook.on('stderr', function(data) { console.log(data.toString()); });
  playbook.exec().then((successResult) => {
    console.log("success code: ", successResult.code); // Exit code of the executed command
    console.log("success output: ", successResult.output); // Standard output/error of the executed command
    res.status(200).send("Sentinel init complete.");
  }).catch((error) => {
    console.error(error);
    res.status(500).send(`error: ${error}`);
  });
}

module.exports = {
  init(req, res, next) {
    // Start initialization process
    initializeTerraform(req, res, next);
  },

  destroy(req, res, next) {
    const terraformDestroy = spawn("sudo", ["terraform", "-chdir=./terraform", "destroy", "-auto-approve"]);
    terraformDestroy.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    terraformDestroy.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    terraformDestroy.on('error', (error) => {
      console.log(`error: ${error.message}`);
      res.status(500).send("Destroy failed.");
    });

    terraformDestroy.on("close", code => {
      console.log(`child process exited with code ${code}`);
      res.status(200).send("Destroy complete.");
    });
  },

};