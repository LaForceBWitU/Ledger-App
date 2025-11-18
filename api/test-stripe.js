// Test Stripe connection
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?
        `sk_live_...${process.env.STRIPE_SECRET_KEY.slice(-4)}` : '❌ NOT SET',
      STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || '❌ NOT SET',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?
        `re_...${process.env.RESEND_API_KEY.slice(-4)}` : '❌ NOT SET',
      FRONTEND_URL: process.env.FRONTEND_URL || '❌ NOT SET',
    },
    status: 'Environment variables loaded'
  };

  // Test Stripe API
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Try to retrieve the price
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);

    diagnostics.stripe_test = {
      status: '✅ SUCCESS',
      price_id: price.id,
      amount: `$${price.unit_amount / 100}`,
      currency: price.currency.toUpperCase(),
      type: price.type,
    };
  } catch (error) {
    diagnostics.stripe_test = {
      status: '❌ FAILED',
      error: error.message,
      code: error.code,
      hint: error.message.includes('No such price')
        ? 'Price ID is invalid or does not exist in your Stripe account'
        : error.message.includes('Invalid API Key')
        ? 'Stripe Secret Key is invalid'
        : error.message.includes('testmode')
        ? 'You are using a test mode key with a live mode price (or vice versa)'
        : 'Check the error message above'
    };
  }

  res.status(200).json(diagnostics);
};
