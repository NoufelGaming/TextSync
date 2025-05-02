# Connecting from Your Phone

## Common Issues

If you're having trouble connecting from your phone to the TextSync app running on your PC, here are the most common solutions:

### 1. Make sure both devices are on the same network

Your phone and PC must be connected to the same WiFi network. This won't work if your phone is using mobile data.

### 2. Use the correct IP address

When the server starts, it now shows a list of IP addresses that you can use to connect from other devices. Look for something like:

```
To connect from other devices (like your phone), use one of these addresses:
http://192.168.x.x:3000
```

On your phone, open a browser and enter exactly that address including the port number (`:3000`).

### 3. Check your firewall

Windows Firewall might be blocking connections to your PC. To allow connections:

1. When you first run the app, Windows might ask if you want to allow the connection - click "Allow"
2. If not, you might need to manually add an exception to your firewall for port 3000

### 4. Make sure the server is listening on all interfaces

The server has been updated to listen on all network interfaces (0.0.0.0), but if you're still having issues:

1. Make sure you're using the latest version of the server.js file
2. Restart the application by closing and reopening run_demo.bat

### 5. Test with a different browser on your phone

Sometimes certain mobile browsers might have issues. Try using Chrome, Firefox, or Safari.

## Quick Test

To verify if the connection issue is with your phone or the server:

1. On your PC, open a browser and try navigating to the IP address shown (not localhost)
2. If that works, the server is correctly configured and the issue is likely with your phone's connection

## Still Having Problems?

If none of the above solutions work:

1. Try temporarily disabling your firewall
2. Check if your router has client isolation enabled (this prevents devices from seeing each other)
3. Try using a tool like "Fing" on your phone to scan your network and make sure it can see your PC 