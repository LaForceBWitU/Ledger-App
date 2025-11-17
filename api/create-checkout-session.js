const Stripe = require('stripe');

export default async function handler(req, res) {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured. Please add it to your Vercel environment variables.');
    }

    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error('STRIPE_PRICE_ID not configured. Please add it to your Vercel environment variables.');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Determine success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || req.headers.referer?.replace(/\/$/, '');

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}?payment=cancel`,
      metadata: {
        product: 'Ledger App Lifetime Access'
      }
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
      debug: process.env.NODE_ENV === 'development' ? {
        frontendUrl,
        priceId: process.env.STRIPE_PRICE_ID
      } : undefined
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
      hint: error.message.includes('No such price')
        ? 'The STRIPE_PRICE_ID is invalid. Please check your Stripe dashboard for the correct Price ID (starts with price_).'
        : error.message.includes('Invalid API Key')
        ? 'The STRIPE_SECRET_KEY is invalid. Please check your Stripe dashboard for the correct secret key.'
        : 'Check the server logs for more details.'
    });
  }
}
