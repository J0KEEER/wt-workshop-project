import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

let io = null;

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('WebSocket origin not allowed'));
                }
            },
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authenticate WebSocket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id} (${socket.user?.username})`);
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) throw new Error('Socket.IO not initialised — call initSocket first');
    return io;
}
