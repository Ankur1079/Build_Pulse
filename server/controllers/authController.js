const authService = require('../services/authService');

async function handleGitHubCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  try {
    const accessToken = await authService.exchangeCodeForToken(code);
    const user = await authService.syncUserProfile(accessToken);

    // In production, generate a JWT token or set an HTTP-only cookie here
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
      },
      accessToken,
    });
  } catch (error) {
    console.error('OAuth processing failure:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { handleGitHubCallback };