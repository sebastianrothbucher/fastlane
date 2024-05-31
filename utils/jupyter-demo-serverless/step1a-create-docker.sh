#!/bin/bash
set -e
. .env
. shell-helper.inc
cp ../jupyter-demo/Service-Demo.ipynb .
docker build . -t testjupyter:0.1 -t testjupyter:latest
rm ./Service-Demo.ipynb