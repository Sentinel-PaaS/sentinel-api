/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const { spawn } = require("child_process");

module.exports = {
  async init(req, res, next) {
    // Initialize Terraform
    const terraformInit = spawn("terraform", ["-chdir=./terraform", "init", "-input=false"]);
    terraformInit.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    terraformInit.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    terraformInit.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    terraformInit.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });

    // Launch initial infrastructure
    const terraformApply = spawn("terraform", ["-chdir=./terraform", "apply", "-input=false", "-auto-approve"]);
    terraformApply.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    terraformApply.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    terraformApply.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    terraformApply.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });

    // Complete configuration (install docker, initialize swarm, launch Traefik)
    let playbook = new Ansible.Playbook().playbook('ansible/playbook');
    playbook.inventory('ansible/inventory/hosts');

    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.send("okay");
    }).catch((error) => {
      console.error(error);
    });
  },

  async destroy(req, res, next) {
    const terraformDestroy = spawn("terraform", ["-chdir=./terraform", "destroy", "-auto-approve"]);
    terraformDestroy.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    terraformDestroy.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    terraformDestroy.on('error', (error) => {
      console.log(`error: ${error.message}`);
    });

    terraformDestroy.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
  },

};