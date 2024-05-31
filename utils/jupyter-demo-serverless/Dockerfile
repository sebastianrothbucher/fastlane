FROM arm64v8/python:3.12
# thx, https://github.com/zulhfreelancer/docker-aws-cli-v2-on-ubuntu/blob/master/Dockerfile
RUN apt-get update && apt-get install -y curl unzip
RUN curl https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip -o awscliv2.zip \
  && unzip awscliv2.zip \
  && ./aws/install \
  && rm -rf aws awscliv2.zip
# we just want jupyter and requirements - shows that we could really fully automate via self-service
COPY Service-Demo.ipynb requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
CMD if [ ! $S3_RES_LOC ]; then echo 'need S3_RES_LOC'; exit 1; else echo 'running jupyter' && python3 -m jupyter nbconvert --to=html --no-input --stdout --execute Service-Demo.ipynb > res.html && echo 'uploading to S3' && aws s3 cp res.html $S3_RES_LOC && echo 'done'; fi
