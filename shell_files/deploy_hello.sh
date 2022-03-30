#!/bin/bash

cd ./ansible

ansible-playbook -i inventory/hosts hello_deploy.yml