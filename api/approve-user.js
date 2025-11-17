const { verifyApprovalToken, sendUserApprovedEmail } = require('./utils/resend');

export default async function handler(req, res) {
  const { userId, token } = req.query;

  if (!userId || !token) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">Invalid Approval Link</h1>
          <p>This approval link is missing required parameters.</p>
        </body>
      </html>
    `);
  }

  // Verify the token
  if (!verifyApprovalToken(userId, token)) {
    return res.status(403).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">Invalid Token</h1>
          <p>This approval link is invalid or has been tampered with.</p>
        </body>
      </html>
    `);
  }

  try {
    // Fetch user from Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const users = await userResponse.json();

    if (!users || users.length === 0) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #f44336;">User Not Found</h1>
            <p>No user found with ID: ${userId}</p>
          </body>
        </html>
      `);
    }

    const user = users[0];

    // Check if already approved
    if (user.approved) {
      return res.status(200).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #2196F3;">Already Approved</h1>
            <p>${user.email} was already approved on ${new Date(user.approved_at).toLocaleString()}.</p>
            <p>No action needed.</p>
          </body>
        </html>
      `);
    }

    // Update user to approved
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        approved: true,
        approved_at: new Date().toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update user approval status');
    }

    // Send approval email to user
    try {
      await sendUserApprovedEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Continue even if email fails
    }

    // Return success page
    return res.status(200).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #4CAF50;">✓ User Approved Successfully!</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; max-width: 500px; margin: 20px auto;">
            <p><strong>User:</strong> ${user.email}</p>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Approved:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666;">The user has been notified via email and can now access the app.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #f44336;">Error</h1>
          <p>Failed to approve user: ${error.message}</p>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
}
