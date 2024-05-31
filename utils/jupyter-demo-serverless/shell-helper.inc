function assumeRoleAndExport {
  local STS_RES=$(aws sts assume-role --role-arn $1 --role-session-name "jupyter-fargate-$(uuidgen)")
  export AWS_ACCESS_KEY_ID=$(echo $STS_RES | jq -r .Credentials.AccessKeyId)
  export AWS_SECRET_ACCESS_KEY=$(echo $STS_RES | jq -r .Credentials.SecretAccessKey)
  export AWS_SESSION_TOKEN=$(echo $STS_RES | jq -r .Credentials.SessionToken)
}