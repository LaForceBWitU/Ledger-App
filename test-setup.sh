#!/bin/bash

echo "🔍 Ledger App - Setup Verification"
echo "=================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file exists"

    # Check for required variables
    if grep -q "STRIPE_SECRET_KEY=sk_live" .env; then
        echo "✅ STRIPE_SECRET_KEY is set"
    else
        echo "❌ STRIPE_SECRET_KEY missing or invalid"
    fi

    if grep -q "STRIPE_PRICE_ID" .env; then
        price_id=$(grep "STRIPE_PRICE_ID" .env | cut -d'=' -f2)
        if [[ $price_id == price_* ]]; then
            echo "✅ STRIPE_PRICE_ID is correct format (price_...)"
        elif [[ $price_id == prod_* ]]; then
            echo "❌ STRIPE_PRICE_ID is WRONG - it's a Product ID, not Price ID!"
            echo "   Current value: $price_id"
            echo "   You need to get the Price ID from: https://dashboard.stripe.com/products"
        else
            echo "⚠️  STRIPE_PRICE_ID set but format unclear: $price_id"
        fi
    else
        echo "❌ STRIPE_PRICE_ID not set"
    fi

    if grep -q "RESEND_API_KEY=re_" .env; then
        echo "✅ RESEND_API_KEY is set"
    else
        echo "❌ RESEND_API_KEY missing or invalid (should start with re_)"
    fi

    if grep -q "OWNER_EMAIL=BundleUpMontana@gmail.com" .env; then
        echo "✅ OWNER_EMAIL is set"
    else
        echo "⚠️  OWNER_EMAIL not set or different"
    fi
else
    echo "❌ .env file not found!"
fi

echo ""
echo "📦 Checking dependencies..."

if [ -d node_modules ]; then
    echo "✅ node_modules exists"

    if [ -d node_modules/resend ]; then
        echo "✅ resend package installed"
    else
        echo "❌ resend package not installed - run: npm install"
    fi

    if [ -d node_modules/stripe ]; then
        echo "✅ stripe package installed"
    else
        echo "❌ stripe package not installed - run: npm install"
    fi
else
    echo "❌ node_modules not found - run: npm install"
fi

echo ""
echo "🗂️  Checking API endpoints..."

if [ -d api ]; then
    echo "✅ api/ directory exists"

    if [ -f api/create-checkout-session.js ]; then
        echo "✅ create-checkout-session.js exists"
    else
        echo "❌ create-checkout-session.js missing"
    fi

    if [ -f api/notify-owner.js ]; then
        echo "✅ notify-owner.js exists"
    else
        echo "❌ notify-owner.js missing"
    fi

    if [ -f api/utils/resend.js ]; then
        echo "✅ resend.js utility exists"
    else
        echo "❌ resend.js utility missing"
    fi
else
    echo "❌ api/ directory not found"
fi

echo ""
echo "🔧 Checking Vercel config..."

if [ -f vercel.json ]; then
    echo "✅ vercel.json exists"
else
    echo "❌ vercel.json missing (just created it for you)"
fi

echo ""
echo "=================================="
echo "📋 Next Steps:"
echo ""
echo "1. Fix any ❌ issues above"
echo ""
echo "2. Test locally:"
echo "   npx vercel dev"
echo "   Then visit: http://localhost:3000"
echo ""
echo "3. Clear browser localStorage:"
echo "   F12 → Console → localStorage.clear(); location.reload();"
echo ""
echo "4. Deploy to Vercel:"
echo "   git add ."
echo "   git commit -m 'Add vercel config'"
echo "   git push"
echo ""
echo "See DEBUG.md for detailed troubleshooting!"
