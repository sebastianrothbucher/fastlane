#!/bin/bash
set -e
. .env
. shell-helper.inc
echo "Running jupyter via local docker"
if [ ! $S3_RES_PREFIX ]; then
  echo "Export S3_RES_PREFIX before running this"
  exit 1
elif [ ! $UPPER ]; then
  echo "Specify an upper bound via exporting UPPER"
  exit 2
fi
export S3_RES_LOC="$S3_RES_PREFIX/res-$(uuidgen).html"
assumeRoleAndExport $IAM_ROLE_RUN
docker run --rm -e S3_RES_LOC -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN -e UPPER testjupyter:latest
