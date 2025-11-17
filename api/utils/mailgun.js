const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);

let mg = null;

function getMailgunClient() {
  if (!mg) {
    mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });
  }
  return mg;
}

async function sendOwnerNotification(userEmail, userName, userId) {
  const client = getMailgunClient();
  const approvalUrl = `${process.env.FRONTEND_URL}/api/approve-user?userId=${userId}&token=${generateApprovalToken(userId)}`;

  const messageData = {
    from: `Ledger App <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: process.env.OWNER_EMAIL,
    subject: 'New User Registration - Approval Required',
    html: `
      <h2>New User Registration</h2>
      <p>A new user has registered and is awaiting your approval:</p>
      <ul>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>User ID:</strong> ${userId}</li>
        <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>
        <a href="${approvalUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
          Approve User Access
        </a>
      </p>
      <p>Or copy this link: ${approvalUrl}</p>
      <p><em>Note: This user has completed payment and account creation, but cannot access the app until you approve them.</em></p>
    `,
  };

  try {
    const result = await client.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log('Owner notification sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send owner notification:', error);
    throw error;
  }
}

async function sendUserWelcomeEmail(userEmail, userName) {
  const client = getMailgunClient();

  const messageData = {
    from: `Ledger App <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: userEmail,
    subject: 'Welcome to Ledger App - Pending Approval',
    html: `
      <h2>Welcome to Ledger App!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for registering and completing your payment. Your account has been created successfully.</p>
      <p><strong>Your account is currently pending approval.</strong></p>
      <p>You will receive another email once the owner approves your access. This usually takes less than 24 hours.</p>
      <p>If you have any questions, please contact us at ${process.env.OWNER_EMAIL}.</p>
      <p>Best regards,<br>The Ledger App Team</p>
    `,
  };

  try {
    const result = await client.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log('Welcome email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

async function sendUserApprovedEmail(userEmail, userName) {
  const client = getMailgunClient();

  const messageData = {
    from: `Ledger App <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: userEmail,
    subject: 'Your Ledger App Access Has Been Approved!',
    html: `
      <h2>You're Approved!</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your Ledger App account has been approved and you now have full access.</p>
      <p>
        <a href="${process.env.FRONTEND_URL}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
          Access Ledger App Now
        </a>
      </p>
      <p>You can now log in and start using all features of the app.</p>
      <p>Best regards,<br>The Ledger App Team</p>
    `,
  };

  try {
    const result = await client.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log('Approval email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send approval email:', error);
    throw error;
  }
}

// Simple token generation for approval links
function generateApprovalToken(userId) {
  const crypto = require('crypto');
  const secret = process.env.APPROVAL_SECRET || 'your-secret-key-change-this';
  return crypto.createHmac('sha256', secret).update(userId.toString()).digest('hex');
}

function verifyApprovalToken(userId, token) {
  const expectedToken = generateApprovalToken(userId);
  return token === expectedToken;
}

module.exports = {
  sendOwnerNotification,
  sendUserWelcomeEmail,
  sendUserApprovedEmail,
  generateApprovalToken,
  verifyApprovalToken,
};
