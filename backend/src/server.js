require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { autoSeedIfEmpty } = require('./autoSeed');

const PORT = process.env.PORT || 5000;

// 1. Listen immediately on port 5000 so frontend never receives ERR_CONNECTION_REFUSED
const server = app.listen(PORT, () => {
  console.log(`[Statuzzz Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// 2. Connect to database and seed asynchronously
(async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();
  } catch (err) {
    console.error('[Server Init Error]', err.message);
  }
})();

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err.message);
});
