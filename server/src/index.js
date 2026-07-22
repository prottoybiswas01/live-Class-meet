import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { serverLogger } from './config/winston.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { initializeSocketIO } from './socket/socketHandler.js';

// Route imports
import adminRoutes from './routes/admin.routes.js';
import classRoutes from './routes/class.routes.js';
import participantRoutes from './routes/participant.routes.js';
import recordingRoutes from './routes/recording.routes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach Socket.IO instance to HTTP requests for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allows media stream WebRTC rendering
}));
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global Rate Limiter
app.use('/api/', apiLimiter);

// API Endpoints
app.use('/api/admin', adminRoutes);
app.use('/api/class', classRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/class/recording', recordingRoutes);

// Health check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Serve frontend build if exists
const clientBuildPath = path.join(__dirname, '../../dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Live Classroom API is running. Frontend build not found at dist.');
    }
  });
});

// Global Error Handler
app.use(errorHandler);

// Socket.IO Handler Registration
initializeSocketIO(io);

server.listen(PORT, () => {
  serverLogger.info(`🚀 Production Live Classroom Backend running on port ${PORT}`);
  serverLogger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
