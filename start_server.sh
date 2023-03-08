#!/bin/bash
git pull
# Set the desired remote host where the "<>" is
export SD_URL=http://127.0.0.1:7860

# Check python was installed
if ! hash python; then
    echo "Python is not installed"
    exit 1
fi

# Check the default python version
orig_ver=$(python -V 2>&1)
ver=$( echo "$orig_ver" | sed 's/.* \([0-9]\).\([0-9]\).*/\1\2/')
if [[ "$ver" -gt "37" ]] # Because of uvicorn==0.20.0 in requirements
then
    echo "You have valid version of ($orig_ver)"
else
    echo "Your version ($orig_ver) not valid, should be >3.7"
    exit 1
fi

# Check if the desired environment exists
if [ ! -d "server_env" ]; then
  # Create the environment if it doesn't exist
  python3 -m venv server_env
  source ./server_env/bin/activate
  python3 -m pip install -r requirements.txt
else
  source ./server_env/bin/activate
fi

cd ./server/python_server
python3 -m uvicorn serverMain:app --reload
