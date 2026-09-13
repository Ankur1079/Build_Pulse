// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// 1. Redirect user to GitHub OAuth login page
router.get('/github', (req, res) => {
  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', process.env.GITHUB_CALLBACK_URL);
  githubUrl.searchParams.set('scope', 'read:user,repo');
  res.redirect(githubUrl);
});

// 2. GitHub OAuth Callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Authorization code missing');

  try {
    // Exchange code for Access Token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) throw new Error('Failed to retrieve access token');

    // Fetch user details from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: githubId, login: username, avatar_url: avatarUrl } = userResponse.data;

    // Save or update user in PostgreSQL
    const userQuery = `
      INSERT INTO users (github_id, username, avatar_url, access_token)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (github_id) DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, access_token = EXCLUDED.access_token
      RETURNING id, github_id, username, avatar_url;
    `;
    const userResult = await db.query(userQuery, [
  githubId.toString(), 
  username, 
  avatarUrl, 
  accessToken
]);
    const user = userResult.rows[0];
    // Generate JWT token for BuildPulse UI session
    const jwtToken = jwt.sign(
      { id: user.id, github_id: user.github_id, username: user.username, access_token: accessToken },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with JWT token in query parameter
    res.redirect(`${process.env.CLIENT_URL}?token=${jwtToken}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err.message);
    res.status(500).send('Authentication failed');
  }
});

// 3. Get Current Authenticated User
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, github_id, username, avatar_url FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;