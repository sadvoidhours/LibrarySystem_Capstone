require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');
const { validateEnv } = require('../src/config/env');

validateEnv();

module.exports = async (req, res) => {
  await connectDB();

  return app(req, res);
};