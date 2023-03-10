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
major_version=$(echo "$orig_ver" | sed 's/[^0-9]*\([0-9]*\)\..*/\1/')
minor_subversion=$(echo "$orig_ver" | sed -E 's/^[^.]*\.([^.]*).*$/\1/')
if [[ "$major_version" -ge "3" ]] && [[ "$minor_subversion" -ge "7" ]] # Because of uvicorn==0.20.0 in requirements
then
    echo "You have valid version of $orig_ver"
else
    echo "Your version $orig_ver not valid, should be >=3.7"
    exit 1
fi


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
