import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import dependencyRoutes from './routes/dependencies.js';
import dsaRoutes from './routes/dsa.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (5173, etc.) and all local requests
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dsa-project-planner-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dependencies', dependencyRoutes);
app.use('/api/dsa', dsaRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 DSA Project Planner Backend is running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

// Port error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another process.`);
    console.error('To resolve: stop the conflicting process or set PORT in backend/.env');
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful termination
const handleShutdown = () => {
  console.log('\nClosing backend server gracefully...');
  server.close(() => {
    console.log('Backend server stopped.');
    process.exit(0);
  });
};
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export { app, server };
