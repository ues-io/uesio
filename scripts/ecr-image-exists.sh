#!/usr/bin/bash

# THis script needs to exist because Github Actions will terminate a Step if any command
# throws a non-zero exit code. This AWS CLI command throws a 254 if the requested image does not exist.
# We want to trap that exit code here in this bash script and then return a string rather than relying on exit codes,
# in order to prevent GH Actions from barfing and dying.
aws ecr describe-images --registry-id $1 --repository-name $2 --image-ids imageTag=$3 > /dev/null 2>&1

if [[ $? = 0 ]]; then
    echo "yes"
else
    echo "no"
fi