/**
 * Casha Tracker API (PostgreSQL Version)
 * Express.js server with Drizzle ORM
 */

import 'dotenv/config';
import { env } from './config/env';
import express from 'express';
import cors from 'cors';

// Import database
import { testConnection } from './db';

// Import middleware
import { requestLoggerWithSkip } from './middleware/logging.middleware';
import { apiRateLimit } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import expensesRoutes from './routes/expenses.routes';
import categoriesRoutes from './routes/categories.routes';
import budgetsRoutes from './routes/budgets.routes';
import incomeRoutes from './routes/income.routes';
import insightsRoutes from './routes/insights.routes';
import chatRoutes from './routes/chat.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import usersRoutes from './routes/users.routes';
import seedRoutes from './routes/seed.routes';

const app = express();

// ============================================================================
// Core Middleware
// ============================================================================

// CORS configuration - allow multiple localhost ports in development
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// JSON body parser (increased limit for base64 images)
app.use(express.json({ limit: '10mb' }));

// Request logging (skip health check)
app.use(requestLoggerWithSkip(['/health']));

// ============================================================================
// Health Check (before rate limiting)
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: 'postgresql',
  });
});

// ============================================================================
// API Routes (with rate limiting)
// ============================================================================

// Apply global rate limit to API routes
app.use('/api', apiRateLimit);

// Auth routes (public - no JWT required for register/login)
app.use('/api/auth', authRoutes);

// Mount CRUD routes (JWT protected)
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/income-sources', incomeRoutes);

// Mount AI-powered routes (JWT protected)
app.use('/api/insights', insightsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Mount user management routes (JWT protected)
app.use('/api/users', usersRoutes);

// Mount seed routes (JWT protected, development only)
app.use('/api/seed', seedRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (for unmatched routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(env.API_PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log('  Casha Tracker API');
    console.log('===========================================');
    console.log(`  Server:      http://localhost:${env.API_PORT}`);
    console.log(`  Health:      http://localhost:${env.API_PORT}/health`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  Frontend:    ${env.FRONTEND_URL}`);
    console.log(`  Database:    PostgreSQL (connected)`);
    console.log('');
    console.log('  Active Routes:');
    console.log('    /api/auth           (Register, Login, Logout)');
    console.log('    /api/expenses       (CRUD)');
    console.log('    /api/categories     (CRUD)');
    console.log('    /api/budgets        (CRUD)');
    console.log('    /api/income-sources (CRUD)');
    console.log('    /api/chat           (CRUD + AI Stream)');
    console.log('    /api/insights       (Summary + AI)');
    console.log('    /api/recommendations (CRUD + AI)');
    console.log('    /api/users          (Account Management)');
    console.log('    /api/seed           (Demo Data Seeding)');
    console.log('===========================================');
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
