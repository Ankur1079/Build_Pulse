const axios = require('axios');
const db = require('../config/db');

class AuthService {
  /**
   * Exchange OAuth temporary code for access token
   */
  async exchangeCodeForToken(code) {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    return response.data.access_token;
  }

  /**
   * Fetch user details from GitHub and save/update in DB
   */
  async syncUserProfile(accessToken) {
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, login, avatar_url, email } = userResponse.data;

    const upsertQuery = `
      INSERT INTO users (github_id, username, avatar_url, email, access_token)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (github_id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        access_token = EXCLUDED.access_token,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(upsertQuery, [id, login, avatar_url, email, accessToken]);
    return result.rows[0];
  }
}

module.exports = new AuthService();