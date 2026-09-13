const crypto = require('crypto');

function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature) {
    return res.status(401).json({ error: 'Unauthorized: Missing signature header' });
  }

  if (!secret) {
    console.error('CRITICAL: GITHUB_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Internal server configuration error' });
  }

  try {
    // Generate HMAC SHA-256 signature using native Node.js crypto
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(`sha256=${hmac.update(req.rawBody).digest('hex')}`, 'utf8');
    const checksum = Buffer.from(signature, 'utf8');

    // Timing-safe comparison to prevent timing attacks
    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
      return res.status(403).json({ error: 'Forbidden: Signature verification failed' });
    }

    req.githubEvent = event;
    next();
  } catch (err) {
    console.error('Webhook Verification Error:', err.message);
    return res.status(500).json({ error: 'Signature verification internal failure' });
  }
}

module.exports = verifyWebhookSignature;