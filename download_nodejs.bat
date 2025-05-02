@echo off
echo Setting up portable Node.js in the project directory...
echo.

:: Create local directories
if not exist nodejs mkdir nodejs
if not exist nodejs\download mkdir nodejs\download

:: Download Node.js portable zip
echo Downloading Node.js portable version...
powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.16.1/node-v18.16.1-win-x64.zip' -OutFile 'nodejs\download\nodejs.zip'}"

if %errorlevel% neq 0 (
    echo ERROR: Failed to download Node.js.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

:: Extract the zip file
echo Extracting Node.js...
powershell -Command "& {Expand-Archive -Path 'nodejs\download\nodejs.zip' -DestinationPath 'nodejs' -Force}"

if %errorlevel% neq 0 (
    echo ERROR: Failed to extract Node.js.
    pause
    exit /b 1
)

:: Rename the extracted folder to make the path simpler
powershell -Command "& {Get-ChildItem -Path 'nodejs' -Filter 'node-v*' | Rename-Item -NewName 'node'}"

:: Create an empty npm cache folder
if not exist nodejs\npm-cache mkdir nodejs\npm-cache

:: Create an .npmrc file to configure npm to use local cache
echo cache=./nodejs/npm-cache > .npmrc

echo Node.js has been successfully set up in the project directory!
echo.

:: Now install the project dependencies using the local Node.js
echo Installing project dependencies...
nodejs\node\npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Setup complete! You can now run the application using run_demo.bat
echo.
pause 