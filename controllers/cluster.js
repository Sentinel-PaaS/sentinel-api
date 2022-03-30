/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const { spawn } = require("child_process");
const fs = require("fs");
const ini = require("ini");
const AXIOS = require('axios');
const HTTPS = require('https');
const {getClusterMetrics} = require('./cluster_metrics');

function getWorkerCount() {
  const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
  return Object.keys(hosts.workers).length;
}

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

// Initialize Terraform
async function initializeTerraform(req, res, next) {
  try {
    const { stdout, stderr } = await exec("sudo terraform -chdir=./terraform init -input=false");
    console.log('stdout: ', stdout);
    console.error('stderr: ', stderr);
  } catch (error) {
    res.status(500).send({ error });
    return 0;
  }

  // const terraformInit = spawn("sudo", ["terraform", "-chdir=./terraform", "init", "-input=false"]);
  // terraformInit.stdout.on("data", data => {
  //   console.log(`stdout: ${data}`);
  // });

  // terraformInit.stderr.on("data", data => {
  //   console.log(`stderr: ${data}`);
  // });

  // terraformInit.on('error', (error) => {
  //   console.log(`error: ${error.message}`);
  //   res.status(500).send(`error: ${error}`);
  // });

  // terraformInit.on("close", code => {
  //   console.log(`child process exited with code ${code}`);
  //   applyTerraform(req, res, next);
  // });
}

// Launch initial infrastructure
async function applyTerraform(req, res, next) {
  try {
    const { stdout, stderr } = await exec("sudo terraform -chdir=./terraform apply -input=false -auto-approve");
    console.log('stdout: ', stdout);
    console.error('stderr: ', stderr);
  } catch (error) {
    res.status(500).send({ error });
    return 0;
  }
  // const terraformApply = spawn("sudo", ["terraform", "-chdir=./terraform", "apply", "-input=false", "-auto-approve"]);
  // terraformApply.stdout.on("data", data => {
  //   console.log(`stdout: ${data}`);
  // });

  // terraformApply.stderr.on("data", data => {
  //   console.log(`stderr: ${data}`);
  // });

  // terraformApply.on('error', (error) => {
  //   console.log(`error: ${error.message}`);
  //   res.status(500).send(`error: ${error}`);
  // });

  // terraformApply.on("close", code => {
  //   console.log(`child process exited with code ${code}`);
  //   runAnsiblePlaybook(req, res, next);
  // });
}

// Complete configuration (install docker, initialize swarm, launch Traefik)
function runAnsiblePlaybook(req, res, next, playbookName, successMessage) {
  let playbook = new Ansible.Playbook().playbook('ansible/' + playbookName);
  playbook.inventory('ansible/inventory/hosts');
  playbook.forks(1);
  playbook.on('stdout', function(data) { console.log(data.toString()); });
  playbook.on('stderr', function(data) { console.log(data.toString()); });
  playbook.exec().then((successResult) => {
    console.log("success code: ", successResult.code); // Exit code of the executed command
    console.log("success output: ", successResult.output); // Standard output/error of the executed command
    res.status(200).send(successMessage);
    return 1;
  }).catch((error) => {
    console.error(error);
    res.status(500).send(`error: ${error}`);
    return 0;
  });
}

function scaleUp(req, res, next) {
  // Read the number of workers already existing and add one
  let workerNumber = getWorkerCount() + 1;

  let workerContent = `resource "tls_private_key" "worker_pk_${workerNumber}" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
resource "aws_key_pair" "worker_kp_${workerNumber}" {
  key_name   = "workerKey${workerNumber}"       # Create a "workerKey" in AWS.
  public_key = tls_private_key.worker_pk_${workerNumber}.public_key_openssh

  provisioner "local-exec" { # Export "workerKey${workerNumber}.pem" to the API server.
    command = "echo '\${tls_private_key.worker_pk_${workerNumber}.private_key_pem}' > ~/.ssh/workerKey${workerNumber}.pem"
  }
  depends_on = [
    tls_private_key.worker_pk_${workerNumber}
  ]
}
resource "aws_instance" "worker${workerNumber}" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = "workerKey${workerNumber}"
  vpc_security_group_ids = ["\${aws_security_group.tf_sgswarm.id}", "\${aws_security_group.tf_ssh.id}"]
  tags = {
    Name = "tf worker ${workerNumber}"
  }
  depends_on = [
    aws_key_pair.worker_kp_${workerNumber}
  ]
}
output "worker${workerNumber}_public_ip" {
  value = ["\${aws_instance.worker${workerNumber}.public_ip}"]
}
output "worker${workerNumber}_private_ip" {
  value = ["\${aws_instance.worker${workerNumber}.private_ip}"]
}
`;

  fs.writeFileSync(`terraform/worker${workerNumber}.tf`, workerContent);

  let outputContent = `resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    \${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/managerKey.pem
    [managers:vars]
    manager_private_ip=\${aws_instance.manager1.private_ip}
    [workers]
`;

  for (let x = 1; x <= workerNumber; x++) {
    outputContent += `    \${aws_instance.worker${x}.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/workerKey${x}.pem\n`;
  }
  outputContent += `    DOC
  filename = "../ansible/inventory/hosts"
}`;

  fs.writeFileSync(`terraform/output.tf`, outputContent);
}

function scaleDown(req, res, next) {
  let workerNumber = getWorkerCount();
  if (workerNumber < 1) {
    res.status(400).send("You are down to one instance. If you want zero instances, please use the destroy command.");
    return 0;
  }
  fs.unlinkSync(`terraform/worker${workerNumber}.tf`);
  workerNumber--;

  let outputContent = `resource "local_file" "hosts" {
    content  = <<-DOC
      [managers]
      \${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/managerKey.pem
      [managers:vars]
      manager_private_ip=\${aws_instance.manager1.private_ip}
      [workers]
  `;

  for (let x = 1; x <= workerNumber; x++) {
    outputContent += `    \${aws_instance.worker${x}.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/workerKey${x}.pem\n`;
  }
  outputContent += `    DOC
  filename = "../ansible/inventory/hosts"
}`;

  fs.writeFileSync(`terraform/output.tf`, outputContent);
}

module.exports = {
  async init(req, res, next) {
    // Start initialization process
    await initializeTerraform(req, res, next);
    await applyTerraform(req, res, next);
    try {
      const { stdout, stderr } = await exec("chmod 400 ~/.ssh/managerKey.pem");
      console.log('stdout: permissions changed, ', stdout);
      console.error('stderr: ', stderr);
    } catch (error) {
      res.status(500).send({ error });
      return 0;
    }
    await new Promise(r => setTimeout(r, 10000)); // Sleep for 10 seconds to ensure the infrastructure is up
    runAnsiblePlaybook(req, res, next, "playbook", "Sentinel init complete.");
  },

  async scale(req, res, next) {
    req.body.scaleCluster === 'up' ? scaleUp(req, res, next) : scaleDown(req, res, next);

    await applyTerraform(req, res, next);
    if (req.body.scaleCluster === 'up') {
      try {
        const { stdout, stderr } = await exec(`chmod 400 ~/.ssh/workerKey${getWorkerCount()}.pem`);
        console.log('stdout: permissions changed, ', stdout);
        console.error('stderr: ', stderr);
      } catch (error) {
        res.status(500).send({ error });
        return 0;
      }
      let manager = createDockerAPIConnection();
      let swarmInfo = await manager.swarmInspect();
      let swarmToken = swarmInfo.JoinTokens.Worker;

      const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
      let newWorkerIP = Object.keys(hosts.workers)[getWorkerCount() - 1].split(' ')[0];

      let playbook = new Ansible.Playbook().playbook('ansible/deploy_new_worker').variables({
        swarmToken,
        newWorkerIP,
      });
      playbook.inventory('ansible/inventory/hosts');
      playbook.forks(1);
      playbook.on('stdout', function(data) { console.log(data.toString()); });
      playbook.on('stderr', function(data) { console.log(data.toString()); });
      playbook.exec().then((successResult) => {
        console.log("success code: ", successResult.code); // Exit code of the executed command
        console.log("success output: ", successResult.output); // Standard output/error of the executed command
        res.status(200).send("New instance setup complete.");
        return 1;
      }).catch((error) => {
        console.error(error);
        res.status(500).send(`error: ${error}`);
        return 0;
      });
    } else {
      let workerNumber = getWorkerCount() + 1;
      fs.unlinkSync(`~/.ssh/workerKey${workerNumber}.pem`);
      res.status(200).send("Scale down complete.");
    }
  },

  destroy(req, res, next) {
    let workerNumber = 0;
    if (fs.existsSync('../ansible/inventory/hosts')) {
      workerNumber = getWorkerCount();
    }
    const terraformDestroy = spawn("terraform", ["-chdir=./terraform", "destroy", "-auto-approve"]);
    terraformDestroy.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    terraformDestroy.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    terraformDestroy.on('error', (error) => {
      console.log(`error: ${error.message}`);
      // res.status(500).send("Destroy failed.");
      // return 0;
    });

    terraformDestroy.on("close", code => {
      console.log(`child process exited with code ${code}`);
      // res.status(200).send("Destroy complete.");
      // return 1;
    });

    // delete manager key (all keys)
    fs.unlinkSync(`~/.ssh/managerKey.pem`);
    for (let x = 1; x <= workerNumber; x++) {
      fs.unlinkSync(`~/.ssh/workerKey${x}.pem`);
    }
  },

  async inspectNodes(req, res, next) {
    if (!fs.existsSync('./ansible/inventory/hosts')) { // if hosts file does not exist respond with 404
      res.status(404).send("Manager node does not exist.");
    }

    const managerIP = getManagerIP();

    try {
      
      let nodeMetrics = await getClusterMetrics(managerIP);

      res.json(nodeMetrics);
    } catch (err) {
      console.log(err);
    }
  },
};