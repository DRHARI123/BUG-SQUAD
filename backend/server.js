const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigin : true,
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/bugs', require('./routes/bugRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/test-cases', require('./routes/testCaseRoutes'));
app.use('/api/scenarios', require('./routes/scenarioRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/test-plans', require('./routes/testPlanRoutes'));
app.use('/api/test-suites', require('./routes/testSuiteRoutes'));
app.use('/api/test-runs', require('./routes/testRunRoutes'));
app.use('/api/requirements', require('./routes/requirementRoutes'));
app.use('/api/releases', require('./routes/releaseRoutes'));
app.use('/api/traceability', require('./routes/traceabilityRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/sla', require('./routes/slaRoutes'));
app.use('/api/preferences', require('./routes/preferenceRoutes'));

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    app: 'BUG SQUAD API',
    version: '1.0.0',
    phase: 'Phase 11 - Advanced Analytics & SLA Management Active',
    timestamp: new Date().toISOString(),
  });
});

// Global 404 & Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n==================================================`);
  console.log(` 🐞 BUG SQUAD Backend API running on ${HOST}:${PORT}`);
  console.log(` Phase 2 Enabled: Auth, Projects, Modules, Dashboard`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});
