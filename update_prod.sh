#!/bin/bash

cd ./ansible

ansible-playbook -i inventory/hosts update_stack.yml