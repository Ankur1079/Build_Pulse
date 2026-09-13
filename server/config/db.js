const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cicd_metrics',
  connectionTimeoutMillis: 5000, // 5 seconds timeout limit
});

module.exports = pool;

pool.on('connect', () => {
  console.log('PostgreSQL Pool: Connected successfully');
});

pool.on('error', (err) => {
  console.error('PostgreSQL Pool Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};