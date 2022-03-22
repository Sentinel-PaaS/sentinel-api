#!/bin/bash

cd ./ansible

# At some point we're going to have to prompt the user for the path to thier docker-compose file
ansible-playbook -i inventory/hosts deploy_app.yml 
