document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const roomContainer = document.getElementById('room-container');
    const editorContainer = document.getElementById('editor-container');
    const roomInput = document.getElementById('room-input');
    const joinBtn = document.getElementById('join-btn');
    const createRandomBtn = document.getElementById('create-random-room');
    const roomNameDisplay = document.getElementById('room-name');
    const textEditor = document.getElementById('text-editor');
    const copyBtn = document.getElementById('copy-btn');
    const leaveBtn = document.getElementById('leave-btn');
    const syncStatus = document.getElementById('sync-status');
    const copyStatus = document.getElementById('copy-status');
    const shareUrl = document.getElementById('share-url');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const recentRoomsContainer = document.getElementById('recent-rooms');
    const charCount = document.getElementById('char-count');
    const usersCount = document.getElementById('users-count');
    const passwordToggle = document.getElementById('password-toggle');
    const passwordInput = document.getElementById('password-input');
    const passwordSection = document.getElementById('password-section');

    // Socket.io connection
    const socket = io();

    // Current room ID and auth token
    let currentRoom = '';
    let authToken = null;
    
    // Max number of recent rooms to store
    const MAX_RECENT_ROOMS = 5;
    
    // Initialize dark mode from localStorage
    function initTheme() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.classList.remove('light-mode');
        } else {
            document.documentElement.classList.add('light-mode');
            document.documentElement.classList.remove('dark-mode');
        }
    }

    // Toggle dark mode
    function toggleTheme() {
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        if (isDarkMode) {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('darkMode', 'false');
        } else {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        }
    }
    
    // Display password modal
    function showPasswordModal(roomId, callback) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay fade-in';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <h3>Password Required</h3>
            <p>This room is password protected. Please enter the password to join.</p>
            <div class="input-group modal-input">
                <input type="password" id="modal-password" placeholder="Enter password">
                <button id="modal-submit">Join Room</button>
            </div>
            <button id="modal-cancel" class="text-btn">Cancel</button>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus the password input
        const passwordInput = document.getElementById('modal-password');
        passwordInput.focus();
        
        // Handle submit button click
        const submitBtn = document.getElementById('modal-submit');
        submitBtn.addEventListener('click', () => {
            verifyPassword(roomId, passwordInput.value, callback);
        });
        
        // Handle cancel button click
        const cancelBtn = document.getElementById('modal-cancel');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Handle Enter key press
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                verifyPassword(roomId, passwordInput.value, callback);
            }
        });
        
        // Helper function to verify password
        function verifyPassword(roomId, password, callback) {
            fetch(`/api/rooms/${roomId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    // Password is correct
                    document.body.removeChild(modalOverlay);
                    authToken = data.token;
                    callback(true);
                } else {
                    // Password is incorrect
                    passwordInput.value = '';
                    passwordInput.classList.add('error');
                    passwordInput.placeholder = 'Invalid password, try again';
                    setTimeout(() => {
                        passwordInput.classList.remove('error');
                        passwordInput.placeholder = 'Enter password';
                    }, 1500);
                }
            })
            .catch(err => {
                console.error('Error verifying password:', err);
                alert('Error verifying password. Please try again.');
            });
        }
    }
    
    // Check if a room is password protected
    function checkRoomProtection(roomId, callback) {
        fetch(`/api/rooms/${roomId}/protected`)
            .then(res => res.json())
            .then(data => {
                if (data.protected) {
                    showPasswordModal(roomId, callback);
                } else {
                    callback(true);
                }
            })
            .catch(err => {
                console.error('Error checking room protection:', err);
                callback(true); // Proceed anyway if there's an error checking
            });
    }
    
    // Create a new room with optional password
    function createRoom(roomId, password = null) {
        fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roomId, password })
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('Failed to create room');
            }
        })
        .then(data => {
            joinRoomAfterAuth(roomId);
        })
        .catch(err => {
            console.error('Error creating room:', err);
            joinRoomAfterAuth(roomId); // Try to join anyway in case room exists
        });
    }
    
    // Manage recent rooms in localStorage
    function getRecentRooms() {
        const rooms = localStorage.getItem('recentRooms');
        return rooms ? JSON.parse(rooms) : [];
    }
    
    function addRecentRoom(roomId) {
        if (!roomId) return;
        
        let rooms = getRecentRooms();
        
        // Remove if already exists
        rooms = rooms.filter(room => room !== roomId);
        
        // Add to beginning of array
        rooms.unshift(roomId);
        
        // Limit to max number of rooms
        if (rooms.length > MAX_RECENT_ROOMS) {
            rooms = rooms.slice(0, MAX_RECENT_ROOMS);
        }
        
        localStorage.setItem('recentRooms', JSON.stringify(rooms));
        updateRecentRoomsList();
    }
    
    function updateRecentRoomsList() {
        const rooms = getRecentRooms();
        recentRoomsContainer.innerHTML = '';
        
        if (rooms.length === 0) {
            recentRoomsContainer.innerHTML = `<p class="empty-rooms-msg">No recent rooms. Join a room to get started.</p>`;
            return;
        }
        
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('room-item');
            roomElement.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M21 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"></path>
                    <path d="M16 5V3c0-1.1046-.8954-2-2-2s-2 .8954-2 2v2h4zM16 5H8M12 12v5"></path>
                    <circle cx="12" cy="10" r="1"></circle>
                </svg>
                ${room}
            `;
            roomElement.addEventListener('click', () => {
                roomInput.value = room;
                attemptJoinRoom(room);
            });
            recentRoomsContainer.appendChild(roomElement);
        });
    }
    
    // Debounce function to limit how often text updates are sent
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Generate a random room ID
    function generateRoomId() {
        return Math.random().toString(36).substring(2, 9);
    }

    // Check if there's a room ID in the URL
    function checkUrlForRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room');
        
        if (roomFromUrl) {
            roomInput.value = roomFromUrl;
            attemptJoinRoom(roomFromUrl);
        }
    }

    // Update the URL with the room ID
    function updateUrl(roomId) {
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        window.history.pushState({}, '', url);
        
        // Update share link
        shareUrl.value = url.href;
    }
    
    // Update character count
    function updateCharCount() {
        const count = textEditor.value.length;
        charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }

    // Attempt to join a room (handles password protection check)
    function attemptJoinRoom(roomId) {
        if (!roomId) {
            roomId = generateRoomId();
            
            // Create new room with password if enabled
            if (passwordToggle && passwordToggle.checked && passwordInput.value) {
                createRoom(roomId, passwordInput.value);
            } else {
                createRoom(roomId);
            }
            return;
        }
        
        // Check if room is password protected
        checkRoomProtection(roomId, (success) => {
            if (success) {
                joinRoomAfterAuth(roomId);
            }
        });
    }
    
    // Join a room after authentication (if needed)
    function joinRoomAfterAuth(roomId) {
        if (!roomId) return;
        
        currentRoom = roomId;
        socket.emit('joinRoom', { roomId, token: authToken });
        
        // Add to recent rooms
        addRecentRoom(roomId);
        
        // Update UI
        roomNameDisplay.textContent = roomId;
        roomContainer.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        editorContainer.classList.add('fade-in');
        
        // Update URL
        updateUrl(roomId);
        
        // Emit join event to server for user counting
        socket.emit('userJoined', roomId);
    }

    // Handle initial text loading
    socket.on('initialText', (text) => {
        textEditor.value = text || '';
        updateCharCount();
        syncStatus.textContent = 'Connected and synced';
    });

    // Handle text updates from other clients
    socket.on('textUpdate', (text) => {
        textEditor.value = text;
        updateCharCount();
        showSyncStatus('Text updated from another device');
    });
    
    // Handle authentication required
    socket.on('authRequired', () => {
        showPasswordModal(currentRoom, (success) => {
            if (success) {
                joinRoomAfterAuth(currentRoom);
            } else {
                // If authentication fails, go back to room selection
                leaveRoom();
            }
        });
    });
    
    // Handle users count updates
    socket.on('usersCount', (count) => {
        if (count === 1) {
            usersCount.textContent = 'Just you';
        } else {
            usersCount.textContent = `${count} users connected`;
        }
    });

    // Show sync status with auto-hide
    function showSyncStatus(message) {
        syncStatus.textContent = message;
        
        // Reset after 3 seconds
        setTimeout(() => {
            syncStatus.textContent = 'Connected and synced';
        }, 3000);
    }
    
    // Leave current room
    function leaveRoom() {
        // Emit leave event for user counting
        if (currentRoom) {
            socket.emit('userLeft', currentRoom);
        }
        
        // Clear the room from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.pushState({}, '', url);
        
        // Reset UI
        authToken = null;
        currentRoom = '';
        textEditor.value = '';
        roomInput.value = '';
        if (passwordInput) passwordInput.value = '';
        editorContainer.classList.add('hidden');
        roomContainer.classList.remove('hidden');
        roomContainer.classList.add('fade-in');
    }

    // Send text updates (debounced to avoid flooding the server)
    const sendTextUpdate = debounce(() => {
        if (currentRoom) {
            socket.emit('textUpdate', {
                roomId: currentRoom,
                text: textEditor.value,
                token: authToken
            });
            showSyncStatus('Changes synced');
        }
    }, 500);

    // Event Listeners
    joinBtn.addEventListener('click', () => {
        const roomId = roomInput.value.trim();
        attemptJoinRoom(roomId);
    });
    
    createRandomBtn.addEventListener('click', () => {
        const randomRoom = generateRoomId();
        roomInput.value = randomRoom;
        attemptJoinRoom(randomRoom);
    });

    roomInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const roomId = roomInput.value.trim();
            attemptJoinRoom(roomId);
        }
    });

    textEditor.addEventListener('input', () => {
        sendTextUpdate();
        updateCharCount();
    });

    copyBtn.addEventListener('click', () => {
        textEditor.select();
        document.execCommand('copy');
        
        // Show copy status
        copyStatus.classList.remove('hidden');
        setTimeout(() => {
            copyStatus.classList.add('hidden');
        }, 2000);
    });

    leaveBtn.addEventListener('click', leaveRoom);

    copyLinkBtn.addEventListener('click', () => {
        shareUrl.select();
        document.execCommand('copy');
        
        // Show feedback
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = 'Copy Link';
        }, 2000);
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // Password toggle if it exists
    if (passwordToggle) {
        passwordToggle.addEventListener('change', () => {
            if (passwordToggle.checked) {
                passwordSection.classList.remove('hidden');
            } else {
                passwordSection.classList.add('hidden');
            }
        });
    }

    // Initialize
    initTheme();
    updateRecentRoomsList();
    updateCharCount();
    
    // Check for room ID in URL on page load
    checkUrlForRoom();
}); 