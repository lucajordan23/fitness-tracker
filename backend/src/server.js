import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware
 */
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging (solo in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * Routes
 */
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🏋️ Fitness Tracker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      measurements: 'GET /api/measurements',
      plans: 'GET /api/plans/current'
    }
  });
});

/**
 * Error Handler
 */
app.use(errorHandler);

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ================================');
      console.log('🏋️  FITNESS TRACKER API');
      console.log('================================');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: SQLite (${process.env.DB_PATH})`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   GET  http://localhost:${PORT}/api/measurements`);
      console.log(`   POST http://localhost:${PORT}/api/measurements`);
      console.log(`   GET  http://localhost:${PORT}/api/plans/current`);
      console.log(`   POST http://localhost:${PORT}/api/plans/diet`);
      console.log('');
      console.log('✨ Ready to track your fitness journey!');
      console.log('================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
startServer();

export default app;
