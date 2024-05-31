#!/bin/bash
set -e
. .env
. shell-helper.inc
if [ ! $ECR_REPO ]; then
  echo "Export ECR_REPO before running this"
  exit 1
elif [ ! $IAM_ROLE_BUILD ]; then
  echo "Export IAM_ROLE_BUILD before running this"
  exit 1
fi
assumeRoleAndExport $IAM_ROLE_BUILD
aws ecr get-login-password | docker login --username AWS --password-stdin $(echo $ECR_REPO | sed 's/\/.*//')
docker tag testjupyter:latest "$ECR_REPO:latest"
docker push "$ECR_REPO:latest"
docker logout $(echo $ECR_REPO | sed 's/\/.*//')