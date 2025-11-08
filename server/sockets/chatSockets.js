const onlineUsers = {};

module.exports = (io) => {
  // Broadcast the list of online usernames to all clients
  function broadcastOnlineList() {
    const usernames = Object.values(onlineUsers).map(user => user.username);
    console.log('Server: Online users →', usernames);
    io.emit('online list', usernames);
  }

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Register a new user
    socket.on('register', ({ username, avatar }) => {
      onlineUsers[socket.id] = { username, avatar };
      socket.username = username;
      broadcastOnlineList();
      console.log('Registered:', username);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      delete onlineUsers[socket.id];
      broadcastOnlineList();
      console.log('Disconnected:', socket.id);
    });

    // Handle private messaging
    socket.on('private message', ({ to, message }) => {
      const targetSocketId = Object.keys(onlineUsers).find(
        id => onlineUsers[id].username === to
      );

      if (targetSocketId) {
        io.to(targetSocketId).emit('private message', {
          from: socket.username,
          message,
          avatar: onlineUsers[socket.id]?.avatar || '/avatars/default.png'
        });
      }
    });

    // Typing indicator
    socket.on('typing', ({ to }) => {
      const targetSocketId = Object.keys(onlineUsers).find(
        id => onlineUsers[id].username === to
      );

      if (targetSocketId) {
        io.to(targetSocketId).emit('typing', {
          from: socket.username
        });
      }
    });

    // Stop typing indicator
    socket.on('stop typing', ({ to }) => {
      const targetSocketId = Object.keys(onlineUsers).find(
        id => onlineUsers[id].username === to
      );

      if (targetSocketId) {
        io.to(targetSocketId).emit('stop typing', {
          from: socket.username
        });
      }
    });
  });
};
