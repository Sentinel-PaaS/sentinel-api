/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const Ansible = require("node-ansible");
const Docker = require('dockerode');
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");
const ini = require("ini");
const AXIOS = require('axios');
const HTTPS = require('https');
const { getClusterMetrics } = require('./cluster_metrics');
const bcryptjs = require("bcryptjs");

function getWorkerCount() {
  let workerNumber = 0;
  if (fs.existsSync('./ansible/inventory/hosts')) {
    const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
    workerNumber = Object.keys(hosts.workers).length;
  }

  return workerNumber;
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
    const { stdout, stderr } = await exec("terraform -chdir=./terraform init -input=false");
    console.log('stdout: ', stdout);
    console.error('stderr: ', stderr);
  } catch (error) {
    console.error(error);
  }
}

// Launch initial infrastructure
async function applyTerraform(req, res, next) {
  try {
    const { stdout, stderr } = await exec("terraform -chdir=./terraform apply -input=false -auto-approve");
    console.log('stdout: ', stdout);
    console.error('stderr: ', stderr);
  } catch (error) {
    console.error(error);
  }
}

async function scaleUp(req, res, next) {
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
    command = "echo '\${tls_private_key.worker_pk_${workerNumber}.private_key_pem}' > ../keys/workerKey${workerNumber}.pem"
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
  try {
    const { chownStdout, chownStderr } = await exec(`chown $USER ./terraform/worker${workerNumber}.tf`);
    console.log('stdout: ownership changed, ', chownStdout);
    console.error('stderr: ', chownStderr);
    const { chmodStdout, chmodStderr } = await exec(`chmod 700 ./terraform/worker${workerNumber}.tf`);
    console.log('stdout: permissions changed, ', chmodStdout);
    console.error('stderr: ', chmodStderr);
  } catch (error) {
    console.error(error);
  }

  let outputContent = `resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    \${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/managerKey.pem
    [managers:vars]
    manager_private_ip=\${aws_instance.manager1.private_ip}
    [workers]
`;

  for (let x = 1; x <= workerNumber; x++) {
    outputContent += `    \${aws_instance.worker${x}.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/workerKey${x}.pem\n`;
  }
  outputContent += `    DOC
  filename = "../ansible/inventory/hosts"
}`;

  fs.writeFileSync(`terraform/output.tf`, outputContent);
}

async function scaleDown(req, res, next) {
  let workerNumber = getWorkerCount();
  if (workerNumber < 1) {
    res.status(400).send("You are down to one instance. If you want zero instances, please use the destroy command.");
    return 0;
  }

  // get ip address of worker that will be removed
  const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
  let workerIP = Object.keys(hosts.workers)[workerNumber - 1].split(' ')[0];

  // Set worker node to "down"
  let playbook = new Ansible.Playbook().playbook('ansible/leave_swarm').variables({
    workerIP,
  });
  playbook.inventory('ansible/inventory/hosts');
  playbook.forks(1);
  playbook.on('stdout', function(data) { console.log(data.toString()); });
  playbook.on('stderr', function(data) { console.log(data.toString()); });
  await playbook.exec().then((successResult) => {
    console.log("success code: ", successResult.code); // Exit code of the executed command
    console.log("success output: ", successResult.output); // Standard output/error of the executed command
  }).catch((error) => {
    console.error(error);
  });

  try {
    const { rmTfStdout, rmTfStderr } = await exec(`rm -f terraform/worker${workerNumber}.tf`);
    console.log(`worker${workerNumber}.tf terraform file removed, `, rmTfStdout);
    console.error('stderr: ', rmTfStderr);
  } catch (error) {
    console.error(error);
  }
  workerNumber--;

  let outputContent = `resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    \${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/managerKey.pem
    [managers:vars]
    manager_private_ip=\${aws_instance.manager1.private_ip}
    [workers]
`;

  for (let x = 1; x <= workerNumber; x++) {
    outputContent += `    \${aws_instance.worker${x}.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/workerKey${x}.pem\n`;
  }
  outputContent += `    DOC
  filename = "../ansible/inventory/hosts"
}`;

  fs.writeFileSync(`terraform/output.tf`, outputContent);
}

module.exports = {
  async init(req, res, next) {
    if (!req.body.email) {
      let err = new Error("Email required to configure HTTPS.");
      console.log(err);
      return next(err);
    }
    // Start initialization process
    await initializeTerraform(req, res, next);
    await applyTerraform(req, res, next);
    try {
      const { chownStdout, chownStderr } = await exec("chown $USER ./keys/managerKey.pem");
      console.log('stdout: ownership changed, ', chownStdout);
      console.error('stderr: ', chownStderr);
      const { chmodStdout, chmodStderr } = await exec("chmod 700 ./keys/managerKey.pem");
      console.log('stdout: permissions changed, ', chmodStdout);
      console.error('stderr: ', chmodStderr);
    } catch (error) {
      console.error(error);
    }

    let userEmail = req.body.email;
    await new Promise(r => setTimeout(r, 10000)); // Sleep for 10 seconds to ensure the infrastructure is up
    let playbook = new Ansible.Playbook().playbook('ansible/setup_manager').variables({
      userEmail
    });
    playbook.inventory('ansible/inventory/hosts');
    playbook.forks(1);
    playbook.on('stdout', function(data) { console.log(data.toString()); });
    playbook.on('stderr', function(data) { console.log(data.toString()); });
    playbook.exec().then((successResult) => {
      console.log("success code: ", successResult.code); // Exit code of the executed command
      console.log("success output: ", successResult.output); // Standard output/error of the executed command
      res.status(200).send("Sentinel init complete.");
      return 1;
    }).catch((error) => {
      console.error(error);
      res.status(500).send(`error: ${error}`);
      return 0;
    });
  },

  async scale(req, res, next) {
    if (req.body.scaleCluster === 'up') {
      await scaleUp(req, res, next);
    } else {
      await scaleDown(req, res, next);
    }

    await applyTerraform(req, res, next);
    if (req.body.scaleCluster === 'up') {
      try {
        const { chownStdout, chownStderr } = await exec(`chown $USER ./keys/workerKey${getWorkerCount()}.pem`);
        console.log('stdout: ownership changed, ', chownStdout);
        console.error('stderr: ', chownStderr);
        const { chmodStdout, chmodStderr } = await exec(`chmod 700 ./keys/workerKey${getWorkerCount()}.pem`);
        console.log('stdout: permissions changed, ', chmodStdout);
        console.error('stderr: ', chmodStderr);
      } catch (error) {
        console.error(error);
      }
      let manager = createDockerAPIConnection();
      let swarmInfo = await manager.swarmInspect();
      let swarmToken = swarmInfo.JoinTokens.Worker;

      const hosts = ini.parse(fs.readFileSync('./ansible/inventory/hosts', 'utf-8'));
      let newWorkerIP = Object.keys(hosts.workers)[getWorkerCount() - 1].split(' ')[0];

      await new Promise(r => setTimeout(r, 10000)); // Sleep for 10 seconds to ensure the infrastructure is up
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
      try {
        const { rmKeyStdout, rmKeyStderr } = await exec(`rm -f ./keys/workerKey${workerNumber}.pem`);
        console.log(`workerKey${workerNumber}.pem key removed `, rmKeyStdout);
        console.error('stderr: ', rmKeyStderr);
      } catch (error) {
        console.error(error);
      }

      // Get down nodes
      const manager = createDockerAPIConnection();
      const nodes = await manager.listNodes();
      const downNodes = nodes.filter(node => node.Status.State === 'down');

      // Remove down nodes from swarm
      for (const downNode of downNodes) {
        let nodeID = downNode.ID;
        let playbook = new Ansible.Playbook().playbook('ansible/remove_node').variables({
          nodeID,
        });
        playbook.inventory('ansible/inventory/hosts');
        playbook.forks(1);
        playbook.on('stdout', function(data) { console.log(data.toString()); });
        playbook.on('stderr', function(data) { console.log(data.toString()); });
        await playbook.exec().then((successResult) => {
          console.log("success code: ", successResult.code); // Exit code of the executed command
          console.log("success output: ", successResult.output); // Standard output/error of the executed command
        }).catch((error) => {
          console.error(error);
        });
      }

      res.status(200).send("Scale down complete.");
    }
  },

  async destroy(req, res, next) {
    let workerNumber = getWorkerCount();

    try {
      const { stdout, stderr } = await exec("terraform -chdir=./terraform destroy -auto-approve");
      console.log('stdout: ', stdout);
      console.error('stderr: ', stderr);
    } catch (error) {
      console.error(error);
    }

    // delete all keys
    try {
      const { rmStdout, rmStderr } = await exec("rm -f ./keys/managerKey.pem");
      console.log('managerKey.pem key removed ', rmStdout);
      console.error('stderr: ', rmStderr);
    } catch (error) {
      console.error(error);
    }
    for (let x = 1; x <= workerNumber; x++) {
      try {
        const { rmKeyStdout, rmKeyStderr } = await exec(`rm -f ./keys/workerKey${x}.pem`);
        console.log(`workerKey${x}.pem key removed `, rmKeyStdout);
        console.error('stderr: ', rmKeyStderr);
        const { rmTfStdout, rmTfStderr } = await exec(`rm -f terraform/worker${x}.tf`);
        console.log(`worker${x}.tf terraform file removed `, rmTfStdout);
        console.error('stderr: ', rmTfStderr);
      } catch (error) {
        console.error(error);
      }
    }

    let outputContent = `resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    \${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/managerKey.pem
    [managers:vars]
    manager_private_ip=\${aws_instance.manager1.private_ip}
    [workers]
`;
    outputContent += `    DOC
  filename = "../ansible/inventory/hosts"
}`;

    fs.writeFileSync(`terraform/output.tf`, outputContent);
    res.status(200).send("Destroy complete.");
  },

  async inspectNodes(req, res, next) {
    const managerIP = getManagerIP();

    try {
      let nodeMetrics = await getClusterMetrics(managerIP);

      res.json(nodeMetrics);
    } catch (err) {
      console.log(err);
    }
  },

  async setDomains(req, res, next) {
    const managerIP = getManagerIP();

    let traefikHostName = req.body.traefikHostName;
    let prometheusHostName = req.body.prometheusHostName;
    let grafanaHostName = req.body.grafanaHostName;
    let password = req.body.password;

    bcryptjs.hash(password, 10).then(hashed => {
      // let escapedHash = hashed;
      let escapedHash = hashed.replace(/\$/g, "$$$$");
      //  escapedHash = escapedHash.replace(/\$\$/, "$")
      console.log(escapedHash);

      let playbook = new Ansible.Playbook().playbook('ansible/update_monitor_domains').variables({
        traefikHostName,
        prometheusHostName,
        grafanaHostName,
        escapedHash
      });
      playbook.inventory('ansible/inventory/hosts');
      playbook.forks(1);
      playbook.on('stdout', function(data) { console.log(data.toString()); });
      playbook.on('stderr', function(data) { console.log(data.toString()); });
      playbook.exec().then((successResult) => {
        console.log("success code: ", successResult.code); // Exit code of the executed command
        console.log("success output: ", successResult.output); // Standard output/error of the executed command
        res.status(200).send(`Domains successfully updated. As a reminder, you will use the username "admin" with the password you provided, and you will need to have all your provided hostnames pointing to the following IP address: ${managerIP}.`
        );
        return 1;
      }).catch((error) => {
        console.error(error);
        res.status(500).send(`error: ${error}`);
        return 0;
      });
    });
  },

  getManagerIP(req, res, next) {
    try {
      const managerIP = getManagerIP();
      res.json({managerIP});
    } catch (err) {
      res.status(500).send(`error: ${err}`);
    }
  },
};