# SimpleTextSync

A lightweight, easy-to-use text syncing application that allows you to share text between your devices in real-time.

## Features

- Real-time text syncing between multiple devices
- No account required - just use the same room ID on all devices
- Shareable links for collaborative editing
- Clean, responsive design that works well on mobile and desktop
- One-click copy to clipboard
- Simple, self-contained application with minimal dependencies
- Portable setup - runs with its own Node.js installation, no global installation needed

## Getting Started

### Option 1: Local Installation (Recommended)

This method installs Node.js locally in the project directory, creating a completely self-contained application:

1. Run `download_nodejs.bat` to download and set up Node.js locally
2. Once the setup is complete, run `run_demo.bat` to start the application
3. Open your browser and go to `http://localhost:3000`

### Option 2: Using Global Node.js

If you already have Node.js installed globally:

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and go to `http://localhost:3000`

## How to Use

1. Open the application in your browser
2. Enter a room name or ID (or let the app generate one for you)
3. On your other devices, open the application and enter the same room name/ID
4. Any text typed on one device will instantly sync to all other devices in the same room
5. Use the "Copy to Clipboard" button to easily copy the entire text
6. Share the URL with others to collaborate in real-time

## Accessing from Other Devices

To access the application from other devices on your local network:

1. The application will show your computer's IP address when it starts
2. On your other devices, open a browser and go to `http://YOUR_IP_ADDRESS:3000`

## Cleanup

If you want to remove the local Node.js installation and dependencies:

1. Run `cleanup.bat`
2. This will remove the local Node.js installation and node_modules folder
3. Your text data will remain untouched

## Tech Stack

- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Storage**: LowDB (simple JSON file-based database)

## Deployment

You can easily deploy this application to services like Heroku, Vercel, or any other Node.js hosting provider.

For production use, consider:
- Setting up persistent storage
- Adding authentication if needed
- Configuring proper CORS settings

## License

This project is licensed under the MIT License. 