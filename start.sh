#!/bin/bash

echo "🚀 Starting Ledger App with Vercel Dev..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please make sure .env file exists with your API keys."
    exit 1
fi

# Check critical environment variables
echo "📋 Checking environment variables..."

if grep -q "STRIPE_PRICE_ID=price_1STrb7RbE7vY4nMMftkdZlA8" .env; then
    echo "✅ STRIPE_PRICE_ID is set correctly"
else
    echo "❌ STRIPE_PRICE_ID might be wrong in .env"
fi

if grep -q "RESEND_API_KEY=re_GfC1C7VC_BqJvSQeHXADXByPRXqdpr4Gg" .env; then
    echo "✅ RESEND_API_KEY is set correctly"
else
    echo "❌ RESEND_API_KEY might be wrong in .env"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Starting Vercel Dev..."
echo ""
echo "Once started, you can:"
echo "  1. Visit http://localhost:3000 - Main app"
echo "  2. Visit http://localhost:3000/test.html - Diagnostic page"
echo ""
echo "To clear browser storage:"
echo "  Cmd+Option+I → Console → localStorage.clear(); location.reload();"
echo ""

npx vercel dev
