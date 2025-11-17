const { Resend } = require('resend');

let resend = null;

function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function sendOwnerNotification(userEmail, userName, userId) {
  const client = getResendClient();
  const approvalUrl = `${process.env.FRONTEND_URL}/api/approve-user?userId=${userId}&token=${generateApprovalToken(userId)}`;

  try {
    const result = await client.emails.send({
      from: 'Ledger App <onboarding@resend.dev>', // Use your verified domain later
      to: process.env.OWNER_EMAIL,
      subject: 'New User Registration - Approval Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">New User Registration</h2>
          <p>A new user has registered and is awaiting your approval:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${userName}</p>
            <p style="margin: 8px 0;"><strong>User ID:</strong> ${userId}</p>
            <p style="margin: 8px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approvalUrl}"
               style="background-color: #16a34a;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      display: inline-block;
                      border-radius: 6px;
                      font-weight: bold;">
              Approve User Access
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Or copy this link: <br/><a href="${approvalUrl}">${approvalUrl}</a></p>
          <p style="font-size: 13px; color: #9ca3af; font-style: italic;">
            Note: This user has completed payment and account creation, but cannot access the app until you approve them.
          </p>
        </div>
      `,
    });

    console.log('Owner notification sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send owner notification:', error);
    throw error;
  }
}

async function sendUserWelcomeEmail(userEmail, userName) {
  const client = getResendClient();

  try {
    const result = await client.emails.send({
      from: 'Ledger App <onboarding@resend.dev>', // Use your verified domain later
      to: userEmail,
      subject: 'Welcome to Ledger App - Pending Approval',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Welcome to Ledger App!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for registering and completing your payment. Your account has been created successfully.</p>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Your account is currently pending approval.</p>
          </div>
          <p>You will receive another email once the owner approves your access. This usually takes less than 24 hours.</p>
          <p>If you have any questions, please contact us at ${process.env.OWNER_EMAIL}.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The Ledger App Team</strong></p>
        </div>
      `,
    });

    console.log('Welcome email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

async function sendUserApprovedEmail(userEmail, userName) {
  const client = getResendClient();

  try {
    const result = await client.emails.send({
      from: 'Ledger App <onboarding@resend.dev>', // Use your verified domain later
      to: userEmail,
      subject: 'Your Ledger App Access Has Been Approved! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">You're Approved! 🎉</h2>
          <p>Hi ${userName},</p>
          <p>Great news! Your Ledger App account has been approved and you now have full access.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}"
               style="background-color: #16a34a;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      display: inline-block;
                      border-radius: 6px;
                      font-weight: bold;">
              Access Ledger App Now
            </a>
          </div>
          <p>You can now log in and start using all features of the app.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The Ledger App Team</strong></p>
        </div>
      `,
    });

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
