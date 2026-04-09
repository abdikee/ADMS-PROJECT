import express from 'express';
import cors from 'cors';
import http from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { broadcastRealtimeUpdate, registerRealtimeClient, verifyRealtimeToken } from './realtime.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import pool from './config/database.js';
import { 
  requestMonitor, 
  performanceMonitor, 
  errorMonitor, 
  databaseMonitor, 
  healthMetrics 
} from './middleware/monitoring.js';
import { 
  securityHeaders, 
  securityMonitor, 
  ipBlocker, 
  customSecurityHeaders 
} from './middleware/security.js';
import {
  generalLimiter,
  authLimiter,
  passwordChangeLimiter,
  uploadLimiter,
  createResourceLimiter,
  reportLimiter
} from './middleware/rateLimiter.js';
import { 
  accessibilityHeaders, 
  validateAccessibility 
} from './middleware/accessibility.js';
import { 
  performanceOptimizer, 
  connectionPoolOptimizer, 
  compressionMiddleware, 
  cacheOptimizer,
  metricsCollector 
} from './middleware/performance.js';

const app = express();
const PORT = Number(env.PORT);
const server = http.createServer(app);
const allowedOrigins = new Set(env.CORS_ORIGIN);

// Initialize monitoring
databaseMonitor(pool);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Academic Record Management System API',
      version: '1.0.0',
      description: 'Comprehensive API for managing student academic records',
      contact: {
        name: 'API Support',
        email: 'support@sams.edu'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Apply security middleware first
app.use(securityHeaders);
app.use(customSecurityHeaders);
app.use(ipBlocker);
app.use(securityMonitor);

// Apply rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(new Error('CORS origin header required'));
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply performance and accessibility middleware
app.use(performanceOptimizer);
app.use(compressionMiddleware);
app.use(cacheOptimizer);
app.use(accessibilityHeaders);
app.use(validateAccessibility);

// Apply monitoring middleware
app.use(requestMonitor);
app.use(performanceMonitor);

// Optimize database connection pool
connectionPoolOptimizer(pool);

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && res.statusCode < 400 && req.path.startsWith('/api/')) {
      broadcastRealtimeUpdate({
        method: req.method,
        path: req.path,
      });
    }

    return originalJson(body);
  };

  next();
});

app.get('/api/realtime/stream', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const user = verifyRealtimeToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const cleanup = registerRealtimeClient(res, user);
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    cleanup();
  });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SAMS API Documentation'
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Apply specific rate limiters to routes
app.use('/api/auth', authLimiter);
app.use('/api/profile/me/change-password', passwordChangeLimiter);
app.use('/api/profile/photo', uploadLimiter);
app.use('/api/students', createResourceLimiter);
app.use('/api/teachers', createResourceLimiter);
app.use('/api/subjects', createResourceLimiter);
app.use('/api/classes', createResourceLimiter);
app.use('/api/reports', reportLimiter);

// API routes
app.use('/api', routes);

app.get('/health', (req, res) => {
  const metrics = healthMetrics.getMetrics();
  
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    metrics
  });
});

app.get('/metrics', (req, res) => {
  const healthMetricsData = healthMetrics.getMetrics();
  const performanceMetricsData = metricsCollector.getMetrics();
  
  res.json({
    timestamp: new Date().toISOString(),
    health: healthMetricsData,
    performance: performanceMetricsData
  });
});

app.use(errorMonitor);

app.use((err, req, res, next) => {
  healthMetrics.incrementErrorCount();
  
  if (env.NODE_ENV === 'production') {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage()
  });
  
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
  console.log(`Realtime URL: http://localhost:${PORT}/api/realtime/stream`);
  console.log(`Allowed CORS origins: ${env.CORS_ORIGIN.join(', ')}`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export default app;
