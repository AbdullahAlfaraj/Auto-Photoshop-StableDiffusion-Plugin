@REM @echo off
set SD_URL=http://127.0.0.1:7860

echo does server_env\ exist
if exist server_env\ (
  echo Yes 
  goto :activate_server_env
) else (
  echo No
  goto :create_server_env
)

:create_server_env
python -m venv server_env




@REM pause


:activate_server_env

::run a server
echo my_path: %~dp0
@REM set current_dir=
set VENV_DIR=%~dp0server_env
@REM cd ./server_env/Scripts/
set PYTHON="%VENV_DIR%\Scripts\Python.exe"
%PYTHON% -m pip install -r requirements.txt

cd ./server/python_server
echo python path: %PYTHON%
dir
echo %PYTHON% uvicorn serverMain:app --reload
%PYTHON% -m uvicorn serverMain:app --reload
pause
@REM exit /b
@REM %PYTHON% uvicorn serverMain:app --reload
pause

@REM %PYTHON% img2imgapi.py
@REM activate
@REM echo server_env %PYTHON%
@REM cd ./server/python_server
@REM %PYTHON% img2imgapi.py
@REM uvicorn serverMain:app --reload
@REM dir .
@REM call webui.bat
