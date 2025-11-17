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
    // Log environment (helps debugging)
    console.log('Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasPriceId: !!process.env.STRIPE_PRICE_ID,
      priceId: process.env.STRIPE_PRICE_ID,
      nodeEnv: process.env.NODE_ENV
    });

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is missing!');
      throw new Error('STRIPE_SECRET_KEY not configured. Please add it to your environment variables or .env file.');
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.error('❌ STRIPE_PRICE_ID is missing!');
      throw new Error('STRIPE_PRICE_ID not configured. Please add it to your environment variables or .env file.');
    }

    console.log('✅ Creating Stripe client...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Determine success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || req.headers.referer?.replace(/\/$/, '');

    console.log('✅ Frontend URL:', frontendUrl);
    console.log('✅ Creating checkout session with price:', process.env.STRIPE_PRICE_ID);

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

    console.log('✅ Checkout session created:', session.id);

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
      debug: process.env.NODE_ENV === 'development' ? {
        frontendUrl,
        priceId: process.env.STRIPE_PRICE_ID
      } : undefined
    });
  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    let hint = 'Check the server logs for more details.';

    if (error.message.includes('No such price')) {
      hint = `The Price ID "${process.env.STRIPE_PRICE_ID}" does not exist in your Stripe account. Go to https://dashboard.stripe.com/prices and verify it exists.`;
    } else if (error.message.includes('Invalid API Key')) {
      hint = 'The STRIPE_SECRET_KEY is invalid. Go to https://dashboard.stripe.com/apikeys and copy the correct secret key.';
    } else if (error.message.includes('testmode') || error.code === 'resource_missing') {
      hint = 'You might be using a test mode key with a live mode price (or vice versa). Make sure both are in the same mode.';
    } else if (error.type === 'StripeConnectionError') {
      hint = 'Cannot connect to Stripe. Check your internet connection.';
    }

    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
      hint,
      errorType: error.type,
      errorCode: error.code
    });
  }
}
