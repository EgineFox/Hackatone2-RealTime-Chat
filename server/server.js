const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const dotenv = require('dotenv');
dotenv.config();


// init real-time server:
const server = http.createServer(app);
const io = socketIo( server, {
   cors: {
    origin: ['http://localhost:3000',
             'http://localhost:5000',
             'http://127.0.0.1:3000',
            'http://127.0.0.1:5000'],
    methods: ['GET', 'POST'],
    credentials: true
   }
});


// connect with socket logic:
const chatSockets = require('./sockets/chatSockets');
chatSockets(io);

// start server:
const PORT = 5000;

server.listen( PORT, ()=> {
    console.log(` Server is running at port ${PORT}`);
});