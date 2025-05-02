const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Setup the database
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default data
db.defaults({ rooms: {} }).write();

// Helper function to hash passwords
function hashPassword(password, salt) {
  if (!password) return null;
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Helper function to verify passwords
function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

// Copy favicon to public directory if doesn't exist
const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
if (!fs.existsSync(faviconPath)) {
  const defaultFavicon = Buffer.from(
    'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAMMOAADDDgAAAAAAAAAAAAAA'+
    'AAD//wAA//8AAP//yLDn/8iw5/8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD/'+
    '/wAA//8AAP//AAD//8iw5//IsOf/yLDn/8iw5/8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA'+
    '//8AAP//AAD//8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5/8AAP//AAD//wAA//8AAP//AAD//wAA//8A'+
    'AP//AAD//wAA///IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5/8AAP//AAD//wAA//8AAP//'+
    'AAD//wAA//8AAP//yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5/8AAP//AAD/'+
    '/wAA//8AAP//AAD//wAA///IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/wAA'+
    '//8AAP//AAD//wAA//8AAP//yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//I'+
    'sOf/AAD//wAA//8AAP//AAD//8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/'+
    'yLDn/8iw5/8AAP//AAD//wAA///IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn'+
    '/8iw5//IsOf/yLDn/wAA//8AAP//yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw'+
    '5//IsOf/yLDn/8iw5//IsOf/AAD//8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//I'+
    'sOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/'+
    'yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn'+
    '/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw'+
    '5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/8iw5//I'+
    'sOf/yLDn/8iw5//IsOf/yLDn/8iw5//IsOf/yLDn/w==',
    'base64'
  );
  fs.writeFileSync(faviconPath, defaultFavicon);
}

// Track users in rooms
const roomUsers = {};
// Track authenticated users
const authenticatedUsers = new Set();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API endpoint to create a new room with password
app.post('/api/rooms', (req, res) => {
  const { roomId, password } = req.body;
  
  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }
  
  // Check if room already exists
  const roomExists = db.get('rooms').has(roomId).value();
  
  if (roomExists) {
    return res.status(409).json({ error: 'Room already exists' });
  }
  
  // Create the room with or without password
  let roomData = { text: '' };
  
  if (password) {
    const { hash, salt } = hashPassword(password);
    roomData.protected = true;
    roomData.passwordHash = hash;
    roomData.passwordSalt = salt;
  } else {
    roomData.protected = false;
  }
  
  db.get('rooms').set(roomId, roomData).write();
  
  res.status(201).json({ 
    roomId, 
    protected: roomData.protected,
    message: 'Room created successfully' 
  });
});

// API endpoint to check if a room is password protected
app.get('/api/rooms/:roomId/protected', (req, res) => {
  const { roomId } = req.params;
  
  // Check if room exists
  const room = db.get('rooms').get(roomId).value();
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ protected: !!room.protected });
});

// API endpoint to verify room password
app.post('/api/rooms/:roomId/verify', (req, res) => {
  const { roomId } = req.params;
  const { password } = req.body;
  
  // Check if room exists
  const room = db.get('rooms').get(roomId).value();
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  // If room is not password protected, return success
  if (!room.protected) {
    return res.json({ valid: true });
  }
  
  // Verify password
  const valid = verifyPassword(password, room.passwordHash, room.passwordSalt);
  
  if (valid) {
    // Generate a token for this session
    const token = crypto.randomBytes(32).toString('hex');
    authenticatedUsers.add(token);
    
    return res.json({ valid: true, token });
  }
  
  res.status(401).json({ valid: false, error: 'Invalid password' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle joining a room
  socket.on('joinRoom', (data) => {
    const { roomId, token } = typeof data === 'object' ? data : { roomId: data, token: null };
    
    // Get room data
    const room = db.get('rooms').get(roomId).value();
    
    // Initialize room if it doesn't exist
    if (!room) {
      db.get('rooms').set(roomId, { text: '', protected: false }).write();
    } else if (room.protected && !authenticatedUsers.has(token)) {
      // If room is password protected and user is not authenticated, send error
      socket.emit('authRequired');
      return;
    }
    
    // If we reach here, either the room is not password protected or the user is authenticated
    socket.join(roomId);
    console.log(`Client joined room: ${roomId}`);
    
    // Send current text to the client
    const currentText = db.get(`rooms.${roomId}.text`).value();
    socket.emit('initialText', currentText);
  });
  
  // Handle user joining for counting
  socket.on('userJoined', (roomId) => {
    // Initialize room user tracking if needed
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = new Set();
    }
    
    // Add user to room
    roomUsers[roomId].add(socket.id);
    
    // Broadcast updated user count
    io.to(roomId).emit('usersCount', roomUsers[roomId].size);
  });
  
  // Handle user leaving
  socket.on('userLeft', (roomId) => {
    if (roomUsers[roomId]) {
      roomUsers[roomId].delete(socket.id);
      io.to(roomId).emit('usersCount', roomUsers[roomId].size);
      
      // Clean up if room is empty
      if (roomUsers[roomId].size === 0) {
        delete roomUsers[roomId];
      }
    }
  });
  
  // Handle text updates
  socket.on('textUpdate', (data) => {
    const { roomId, text, token } = data;
    
    // Get room data
    const room = db.get('rooms').get(roomId).value();
    
    // Check if room is password protected and user is authenticated
    if (room && room.protected && !authenticatedUsers.has(token)) {
      // User not authenticated, ignore update
      return;
    }
    
    // Save to database
    db.get('rooms').set(roomId, { 
      ...room,
      text
    }).write();
    
    // Broadcast to all clients in the room except sender
    socket.to(roomId).emit('textUpdate', text);
  });
  
  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    // Remove user from all rooms they were in
    Object.keys(roomUsers).forEach(roomId => {
      if (roomUsers[roomId].has(socket.id)) {
        roomUsers[roomId].delete(socket.id);
        io.to(roomId).emit('usersCount', roomUsers[roomId].size);
        
        // Clean up if room is empty
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
        }
      }
    });
  });
});

// Add a simple API endpoint to get room data
app.get('/api/stats', (req, res) => {
  const roomCount = Object.keys(db.get('rooms').value()).length;
  const activeRooms = Object.keys(roomUsers).length;
  const activeUsers = Object.values(roomUsers).reduce((acc, users) => acc + users.size, 0);
  
  res.json({
    rooms: {
      total: roomCount,
      active: activeRooms
    },
    users: activeUsers
  });
});

// Start the server - IMPORTANT: Listen on 0.0.0.0 to make it accessible from other devices
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser on this device`);
  
  // Try to get the IP addresses to display
  try {
    const networkInterfaces = require('os').networkInterfaces();
    console.log('\nTo connect from other devices (like your phone), use one of these addresses:');
    
    let ipAddresses = [];
    Object.keys(networkInterfaces).forEach(function(ifname) {
      networkInterfaces[ifname].forEach(function(iface) {
        // Skip over internal (loopback) and non-IPv4 addresses
        if(iface.family === 'IPv4' && !iface.internal) {
          ipAddresses.push(iface.address);
          console.log(`http://${iface.address}:${PORT}`);
        }
      });
    });
    
    if(ipAddresses.length === 0) {
      console.log('No network interfaces found. You might not be able to connect from other devices.');
    }
  } catch(e) {
    console.log('\nCould not determine network addresses. Run ipconfig in a separate window to find your IP.');
  }
}); 