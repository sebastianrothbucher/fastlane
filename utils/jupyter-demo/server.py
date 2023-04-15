import subprocess
import os
from flask import Flask, request, Response

app = Flask(__name__)

@app.route("/")
def serveNotebook():
    if not (('code' in request.args) and (request.args['code'] == 'topsecret123')): # TODO: REAL secure random
        return Response(status=401)
    # else do it
    execRes = subprocess.run('jupyter nbconvert --to=html --no-input --stdout --execute Service-Demo.ipynb | echo \'<iframe src="data:text/html;base64,\'"$(cat | base64)"\'" width="800" height="500" class="full-iframe"></iframe>\'', env=dict(os.environ, UPPER=request.args['upper']), capture_output=True, shell=True)
    return Response(execRes.stdout, mimetype='text/html')

app.run()
