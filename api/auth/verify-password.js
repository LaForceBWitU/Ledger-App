const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, hashedPassword } = req.body;

  if (!password || !hashedPassword) {
    return res.status(400).json({ error: 'Password and hashedPassword are required' });
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    res.status(200).json({ isMatch });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
};
