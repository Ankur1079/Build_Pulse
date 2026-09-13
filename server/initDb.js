// initDb.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./config/db');

async function init() {
  try {
    console.log('Running database migrations...');

    // 1. Ensure tables exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        github_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        access_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS repositories (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        github_repo_id BIGINT UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        health_score INT DEFAULT 100,
        open_prs INT DEFAULT 0,
        open_issues INT DEFAULT 0,
        build_status VARCHAR(50) DEFAULT 'passing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Safely add missing columns to existing tables
    await db.query(`
      ALTER TABLE repositories 
        ADD COLUMN IF NOT EXISTS pipeline_stability INT DEFAULT 100,
        ADD COLUMN IF NOT EXISTS code_coverage INT DEFAULT 85,
        ADD COLUMN IF NOT EXISTS test_pass_rate INT DEFAULT 100;
    `);

    console.log('✅ Tables and columns updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

init();