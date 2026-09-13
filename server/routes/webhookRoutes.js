const express = require('express');
const verifyWebhookSignature = require('../middleware/verifyWebhook');
const { handleGitHubWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/github', verifyWebhookSignature, handleGitHubWebhook);

module.exports = router;