#!/bin/bash
set -e
. .env
. shell-helper.inc
echo "Running jupyter via AWS fargate"
if [ ! $S3_RES_PREFIX ]; then
  echo "Export S3_RES_PREFIX before running this"
  exit 1
elif [ ! $ECR_REPO ]; then
  echo "Export ECR_REPO before running this"
  exit 1
elif [ ! $IAM_ROLE_RUN ]; then
  echo "Export IAM_ROLE_RUN before running this"
  exit 1
elif [ ! $FARGATE_CLUSTER ]; then
  echo "Export FARGATE_CLUSTER before running this"
  exit 1
elif [ ! $FARGATE_SUBNETS ]; then
  echo "Export FARGATE_SUBNETS before running this"
  exit 1
elif [ ! $UPPER ]; then
  echo "Specify an upper bound via exporting UPPER"
  exit 2
fi
assumeRoleAndExport $IAM_ROLE_RUN
aws ecs register-task-definition --family jupytertest --execution-role-arn "$IAM_ROLE_RUN" --task-role-arn "$IAM_ROLE_RUN" \
  --requires-compatibilities FARGATE --network-mode awsvpc --runtime-platform "cpuArchitecture=ARM64,operatingSystemFamily=LINUX" \
  --cpu 1024 --memory 4096 \
  --container-definitions "[{\"name\":\"jupytertest\",\"image\":\"$ECR_REPO:latest\",\"essential\":true}]" \
  --no-paginate --no-cli-pager
export S3_RES_LOC="$S3_RES_PREFIX/res-$(uuidgen).html"
aws ecs run-task --cluster $FARGATE_CLUSTER --launch-type FARGATE --task-definition jupytertest \
  --network-configuration "{\"awsvpcConfiguration\":{\"subnets\":[\"$(echo $FARGATE_SUBNETS|sed 's/,/","/g')\"],\"assignPublicIp\":\"ENABLED\"}}" \
  --overrides "{\"containerOverrides\":[{\"name\":\"jupytertest\",\"environment\":[{\"name\":\"UPPER\", \"value\":\"$UPPER\"},{\"name\":\"S3_RES_LOC\", \"value\":\"$S3_RES_LOC\"}]}]}" \
  --no-paginate --no-cli-pager
