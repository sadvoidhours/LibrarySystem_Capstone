require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AuditLog = require('../models/AuditLog');
const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const User = require('../models/User');

const isProduction = process.env.NODE_ENV === 'production';
const allowDbReset = process.env.ALLOW_DB_RESET === 'true';
const logResetAttempt = (status, detail) => {
  console.warn(`[DB_RESET][${new Date().toISOString()}] ${status} - ${detail}`);
};

const collections = [
  { label: 'audit logs', model: AuditLog },
  { label: 'notifications', model: Notification },
  { label: 'payments', model: Payment },
  { label: 'borrowings', model: Borrowing },
  { label: 'books', model: Book },
  { label: 'users', model: User }
];

const run = async () => {
  try {
    if (isProduction && !allowDbReset) {
      logResetAttempt('BLOCKED', 'resetAllSeedData.js blocked in production (set ALLOW_DB_RESET=true to override).');
      process.exit(1);
    }

    logResetAttempt('ALLOWED', `resetAllSeedData.js proceeding (NODE_ENV=${process.env.NODE_ENV || 'unset'}).`);
    await connectDB();

    for (const collection of collections) {
      const result = await collection.model.deleteMany({});
      console.log(`Removed ${result.deletedCount} ${collection.label}.`);
    }

    console.log('Full reset complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset seed data:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();