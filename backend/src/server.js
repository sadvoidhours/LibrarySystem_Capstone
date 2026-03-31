require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const { startInactiveAccountArchiveJob } = require('./services/inactive-account.service');

validateEnv();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });

    startInactiveAccountArchiveJob();
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
