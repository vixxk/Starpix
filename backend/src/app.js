const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const templateRoutes = require('./routes/templateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const frameRoutes = require('./routes/frameRoutes');
const effectRoutes = require('./routes/effectRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const creationRoutes = require('./routes/creationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiVideoRoutes = require('./routes/aiVideoRoutes');
const webRoutes = require('./routes/webRoutes');

const app = express();

// Security and middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Serve local upload fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/frames', frameRoutes);
app.use('/api/effects', effectRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/creations', creationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai-video', aiVideoRoutes);
app.use('/api/admin/ai-video', aiVideoRoutes);

// Web routes for Google Play compliance (Account Deletion web request)
app.use('/', webRoutes);

// Home and Health check endpoints
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    app: 'Starpix Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

app.get('/', healthCheckHandler);
app.get('/api', healthCheckHandler);
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
