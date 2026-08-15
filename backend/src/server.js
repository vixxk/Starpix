require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { autoSeedIfEmpty } = require('./autoSeed');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then auto-seed if DB is empty
connectDB().then(async () => {
  await autoSeedIfEmpty();
});

const server = app.listen(PORT, () => {
  console.log(`[Statuzzz Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err.message);
});
