#!/bin/bash

echo "Setting up SimpleTextSync..."
echo

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies."
        echo "Please make sure Node.js is installed and try again."
        exit 1
    fi
    echo "Dependencies installed successfully."
else
    echo "Dependencies already installed."
fi

echo
echo "Starting SimpleTextSync server..."
echo
echo "When the server starts, open your browser and go to:"
echo "http://localhost:3000"
echo
echo "To access from other devices on your network, use your local IP address:"
echo "Your IP address(es):"
if command -v ifconfig &> /dev/null; then
    ifconfig | grep "inet " | grep -v 127.0.0.1
elif command -v ip &> /dev/null; then
    ip addr show | grep "inet " | grep -v 127.0.0.1
else
    echo "Could not determine IP address. Please check your network settings."
fi
echo
echo "Press Ctrl+C to stop the server when you're done."
echo
npm start 