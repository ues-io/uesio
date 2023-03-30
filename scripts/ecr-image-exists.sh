#!/usr/bin/bash

set -e

aws ecr describe-images --registry-id $1 --repository-name $2 --image-ids imageTag=$3 > /dev/null 2>&1

if [[ $? = 0 ]]; then
    echo "yes"
else
    echo "no"
fi