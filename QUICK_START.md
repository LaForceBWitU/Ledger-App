# QUICK START - Fix Payment & Email Issues

## ⚠️ **Critical Issues Fixed**

1. **❌ Stripe Payment Error** - You're using a **Product ID** instead of a **Price ID**
2. **✅ Email Service Replaced** - Switched from Mailgun to **Resend** (much simpler!)

---

## 🔧 Step 1: Get Your Stripe PRICE ID (Required!)

**The Problem:** You gave me `prod_TQj3o0AGvx2puO` which is a **Product ID**, but Stripe needs a **Price ID**.

### How to Find Your Price ID:

1. Go to: **https://dashboard.stripe.com/products**
2. Find your **$19 Ledger App product**
3. **Look below the product name** - you'll see one or more prices listed
4. Copy the **Price ID** (starts with `price_` like `price_1ABc123xyz...`)

### OR Create a New Price:

If you don't see a price listed:

1. Click on your product
2. Click "Add another price"
3. Set:
   - **Price**: $19.00 USD
   - **One time** (not recurring)
4. Click "Add price"
5. Copy the new Price ID

### Update Your .env File:

```bash
# Change this line in .env:
STRIPE_PRICE_ID=prod_TQj3o0AGvx2puO  ← WRONG (Product ID)

# To this (with your actual Price ID):
STRIPE_PRICE_ID=price_1234567890abcdef  ← CORRECT (Price ID)
```

---

## 📧 Step 2: Set Up Resend (Super Easy!)

Resend is way simpler than Mailgun and has a better free tier.

### Sign Up for Resend:

1. Go to: **https://resend.com/signup**
2. Sign up with your email
3. Verify your email
4. Go to: **https://resend.com/api-keys**
5. Click "Create API Key"
6. Give it a name like "Ledger App"
7. Copy the API key (starts with `re_...`)

### Update Your .env File:

```bash
# Add this line to .env:
RESEND_API_KEY=re_your_actual_api_key_here
```

**Important:** With the free tier, you can only send emails from `onboarding@resend.dev`. This is fine for testing! Later you can verify your own domain.

---

## 🚀 Step 3: Test Locally First

Before deploying, let's test locally:

### Install New Dependencies:

```bash
cd /home/user/Ledger-App
npm install
```

### Run with Vercel Dev:

```bash
npx vercel dev
```

This starts:
- Frontend at http://localhost:3000
- API endpoints at /api/*

### Test the Payment Flow:

1. Open http://localhost:3000
2. Click "Get Lifetime Access Now - $19"
3. You should be redirected to Stripe checkout
4. Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## ☁️ Step 4: Deploy to Vercel

### Add Environment Variables to Vercel:

1. Go to: **https://vercel.com/dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these (get values from your local `.env` file):

```
STRIPE_SECRET_KEY=sk_live_51STqsFRbE7vY4nMM...
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE  ← Use the correct Price ID!
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
OWNER_EMAIL=BundleUpMontana@gmail.com
SUPABASE_URL=https://aikbdtyzigeszkrozdng.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-app-name.vercel.app
APPROVAL_SECRET=ledger-app-approval-secret-change-this-in-production
```

### Deploy:

```bash
git add .
git commit -m "Fix Stripe payment and switch to Resend"
git push
```

Vercel will auto-deploy.

---

## 🔍 Troubleshooting

### "Payment system error" Message

This error means the API endpoint isn't working. Check:

1. **Are you testing locally?**
   - ✅ Use `npx vercel dev` (not `npm run dev`)
   - ❌ `npm run dev` won't run the API endpoints

2. **Have you set the STRIPE_PRICE_ID correctly?**
   - Must be a Price ID (starts with `price_`)
   - NOT a Product ID (starts with `prod_`)

3. **On Vercel?**
   - Check environment variables are set in Vercel dashboard
   - Check deployment logs for errors

### Check Error Details

The error message now includes hints! Look at the browser console (F12) to see:
- "No such price" = Wrong STRIPE_PRICE_ID
- "Invalid API Key" = Wrong STRIPE_SECRET_KEY
- Other errors = Check the error message

### Email Not Sending

1. **Check RESEND_API_KEY** is set in environment variables
2. **Free tier limitation**: Emails only send from `onboarding@resend.dev`
3. **Check Vercel logs** for email errors

---

## 📋 Quick Checklist

Before you can accept payments, make sure:

- [ ] Got Stripe **Price ID** (not Product ID)
- [ ] Updated `STRIPE_PRICE_ID` in .env
- [ ] Signed up for Resend account
- [ ] Got Resend API key
- [ ] Updated `RESEND_API_KEY` in .env
- [ ] Ran `npm install` to install resend package
- [ ] Tested locally with `npx vercel dev`
- [ ] Payment redirects to Stripe checkout
- [ ] Updated Supabase database (ran `supabase-migration.sql`)
- [ ] Added all environment variables to Vercel
- [ ] Deployed to Vercel
- [ ] Tested payment on production site

---

## 🆘 Still Having Issues?

### 1. Test Your Stripe Secret Key

Run this in terminal:

```bash
curl https://api.stripe.com/v1/charges \
  -u sk_live_51STqsFRbE7vY4nMM...: \
  -d amount=1900 \
  -d currency=usd \
  -d source=tok_visa
```

Should return a charge object. If error = wrong secret key.

### 2. Verify Your Price ID Exists

Go to: https://dashboard.stripe.com/test/prices

Search for your Price ID. If not found = wrong ID.

### 3. Check API Endpoint

When running `npx vercel dev`, try visiting:

http://localhost:3000/api/create-checkout-session

Should say "Method not allowed" (that's good - means endpoint is working).

---

## 📚 What Changed?

### Replaced:
- ❌ Mailgun (complicated, requires domain setup)
- ❌ form-data package

### Added:
- ✅ Resend (simple, works immediately)
- ✅ Better error messages
- ✅ CORS headers for local testing
- ✅ Environment variable validation

### Files Modified:
- `api/create-checkout-session.js` - Better error handling
- `api/utils/resend.js` - New email service (replaces mailgun.js)
- `api/notify-owner.js` - Uses Resend
- `api/approve-user.js` - Uses Resend
- `package.json` - Replaced mailgun with resend
- `.env` - Updated variables

---

**Next:** Follow steps 1-4 above to fix your issues! 🚀
