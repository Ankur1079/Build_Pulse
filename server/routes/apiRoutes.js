const express = require('express');
const { handleGitHubCallback } = require('../controllers/authController');
const { getRepoHealthScores } = require('../controllers/repoController');

const router = express.Router();

// Auth Endpoints
router.get('/auth/github/callback', handleGitHubCallback);

// Repo Metrics & Health Score Endpoints
router.get('/repos/health', getRepoHealthScores);

module.exports = router;