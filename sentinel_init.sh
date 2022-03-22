#!/bin/bash
cd ./terraform/

terraform apply -auto-approve

cd ../ansible

# sleep is needed because sometimes it takes some time when terraform finishes before ansible can do it's thing
sleep 3.5 

# There is a know bug in ansible where it continuously asks to verify the ecdsa key in order to ssh when you run the command. The current work around is to set the number of forks. 
#  More info here: https://github.com/ansible/ansible/issues/25068
ansible-playbook -i inventory/hosts swarm_init.yml --fork 1

../deploy_app.sh