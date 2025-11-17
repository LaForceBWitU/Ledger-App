const { sendOwnerNotification, sendUserWelcomeEmail } = require('./utils/resend');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userEmail, userName, userId } = req.body;

  if (!userEmail || !userName || !userId) {
    return res.status(400).json({ error: 'Missing required fields: userEmail, userName, userId' });
  }

  try {
    // Send notification to owner
    await sendOwnerNotification(userEmail, userName, userId);

    // Send welcome email to user
    await sendUserWelcomeEmail(userEmail, userName);

    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully'
    });
  } catch (error) {
    console.error('Failed to send notifications:', error);
    res.status(500).json({
      error: 'Failed to send notifications',
      details: error.message
    });
  }
}
