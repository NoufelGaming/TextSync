@echo off
echo Setting up SimpleTextSync with local Node.js...
echo.

:: Check if the local Node.js is installed
if not exist nodejs\node\node.exe (
    echo Local Node.js installation not found.
    echo Please run download_nodejs.bat first to set up Node.js locally.
    echo.
    pause
    exit /b 1
)
echo Using local Node.js installation.

:: Check for node_modules
if not exist node_modules (
    echo Installing dependencies with local Node.js...
    nodejs\node\npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        echo Please try running download_nodejs.bat again.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
) else (
    echo Dependencies already installed.
)

echo.
echo Starting SimpleTextSync server with local Node.js...
echo.
echo When the server starts, open your browser and go to:
echo http://localhost:3000
echo.
echo To access from other devices on your network, use your local IP address:
ipconfig | findstr "IPv4"
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

:: Run the server using the local Node.js
nodejs\node\node server.js

pause 