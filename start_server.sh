#!/bin/bash

git pull

# Set the desired remote host where the "<>" is
export SD_URL=http://level:7860

# Check if the desired environment exists
if [ ! -d "server_env" ]; then
  # Create the environment if it doesn't exist
  python -m venv server_env
  source ./server_env/bin/activate
  python -m pip install -r requirements.txt
else
  source ./server_env/bin/activate
fi

cd ./server/python_server
python -m uvicorn serverMain:app --reload
