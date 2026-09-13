const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');
const webhookRoutes = require('./routes/webhookRoutes');
const apiRoutes = require('./routes/apiRoutes');
const repoRoutes = require('./routes/repoRoutes');

const app = express();

// 1. Enable CORS (Must be before routes)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// 2. Body Parser with Raw Body Preservation for GitHub Webhooks
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// 3. Route Registrations
app.use('/api/repos', repoRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// 4. Health Check Endpoints
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/health/db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time');
    return res.status(200).json({
      status: 'UP',
      express: 'Running',
      postgres: 'Connected',
      dbTime: result.rows[0].current_time,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);
    return res.status(500).json({
      status: 'DOWN',
      express: 'Running',
      postgres: 'Disconnected',
      error: error.message,
    });
  }
});

// 5. Single Server Initialization
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});