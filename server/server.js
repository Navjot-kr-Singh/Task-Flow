const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity, in production set to client URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    socket.on('joinBoard', (boardId) => {
        socket.join(boardId);
        console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on('leaveBoard', (boardId) => {
        socket.leave(boardId);
        console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Mount routers
const auth = require('./routes/auth');
const boards = require('./routes/boards');
const lists = require('./routes/lists');
const tasks = require('./routes/tasks');

app.use('/api/auth', auth);
app.use('/api/boards', boards);
app.use('/api/lists', lists);
app.use('/api/tasks', tasks);

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
});
