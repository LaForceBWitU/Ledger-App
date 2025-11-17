# Ledger App - Setup Guide

This guide will walk you through setting up the Ledger App for production deployment on Vercel.

## What Was Fixed

### 1. Stripe Payment Integration
- **Before**: Payment system was calling Stripe API directly from frontend with wrong credentials, always failing and granting free access
- **After**: Secure backend API endpoint handles Stripe checkout sessions properly

### 2. Owner Approval System
- **Before**: Users got immediate access after creating account
- **After**: Users must be approved by owner (you) via email before accessing the app

### 3. Email Notifications
- **Before**: No email system existed
- **After**:
  - Owner receives email when new user signs up (with approval link)
  - User receives welcome email when they create account
  - User receives approval confirmation email when approved

### 4. Password Security
- **Before**: Passwords stored in plaintext
- **After**: Passwords hashed with bcrypt before storage

---

## Required Setup Steps

### Step 1: Supabase Database Schema Update

You need to add two new columns to your `users` table in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Table Editor" → "users" table
4. Click "New Column" and add:
   - Column name: `approved`
   - Type: `boolean`
   - Default value: `false`
   - Allow nullable: No

5. Click "New Column" again and add:
   - Column name: `approved_at`
   - Type: `timestamp with time zone`
   - Default value: (leave empty)
   - Allow nullable: Yes

6. Save the changes

### Step 2: Mailgun Setup

1. Go to https://www.mailgun.com/ and sign up for a free account
2. Verify your domain or use Mailgun's sandbox domain (for testing)
3. Get your API credentials:
   - Go to "Sending" → "Domain settings"
   - Copy your **API Key**
   - Copy your **Domain** (e.g., `sandbox123.mailgun.org` or `yourdomain.com`)

4. Add authorized recipients (for sandbox domain):
   - Go to "Sending" → "Authorized Recipients"
   - Add `BundleUpMontana@gmail.com`
   - Verify the email via the confirmation link

### Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (or import this repository if you haven't yet)
3. Go to "Settings" → "Environment Variables"
4. Add the following variables:

```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PRICE_ID=prod_TQj3o0AGvx2puO
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here
OWNER_EMAIL=BundleUpMontana@gmail.com
SUPABASE_URL=https://aikbdtyzigeszkrozdng.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
FRONTEND_URL=https://your-app-name.vercel.app
APPROVAL_SECRET=create_a_random_secret_key_here
```

**Important**:
- Get your STRIPE_SECRET_KEY from https://dashboard.stripe.com/apikeys (starts with `sk_live_`)
- Get your SUPABASE_KEY from your Supabase project settings (anon/public key)
- Replace `your_mailgun_api_key_here` with your actual Mailgun API key
- Replace `your_mailgun_domain_here` with your Mailgun domain
- Replace `https://your-app-name.vercel.app` with your actual Vercel app URL
- For `APPROVAL_SECRET`, generate a random string (e.g., use a password generator)

**Note**: These values are already in your local `.env` file. You just need to copy them to Vercel's environment variables.

### Step 4: Stripe Webhook Setup (Optional but Recommended)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter: `https://your-app-name.vercel.app/api/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 5: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add payment and approval system"
   git push origin main
   ```

2. In Vercel dashboard:
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

3. Once deployed, update the `FRONTEND_URL` environment variable with your actual Vercel URL

---

## How The New System Works

### For New Users:

1. **User visits site** → Sees payment page ($19)
2. **User clicks "Get Lifetime Access"** → Redirected to Stripe checkout
3. **User completes payment** → Redirected back to your site
4. **User creates account** → Account created with `approved: false`
5. **Emails sent**:
   - User receives: "Account created, pending approval"
   - Owner receives: Email with user info and approval link
6. **User tries to login** → Blocked with message "Pending approval"

### For You (Owner):

1. **Receive email** when someone signs up
2. **Click "Approve User"** button in email
3. **System automatically**:
   - Marks user as approved in database
   - Sends user an approval email with login link
4. **User can now login** and access the app

### Approval Email Example:

```
Subject: New User Registration - Approval Required

New User Registration
A new user has registered and is awaiting your approval:

• Email: john@example.com
• Name: john
• User ID: 12345
• Registration Date: Nov 17, 2025 10:30 AM

[Approve User Access] ← Click this button

Or copy this link: https://your-app.vercel.app/api/approve-user?userId=12345&token=abc...

Note: This user has completed payment and account creation, but cannot access
the app until you approve them.
```

---

## Testing Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (copy from `.env.example`)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. For testing Stripe locally, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe-webhook
   ```

---

## Troubleshooting

### Emails Not Sending
- Check Mailgun API key and domain are correct in environment variables
- If using sandbox domain, make sure recipient email is authorized
- Check Vercel function logs for errors

### Payment Not Working
- Verify `STRIPE_SECRET_KEY` is correct (starts with `sk_live_`)
- Check browser console for errors
- Make sure `FRONTEND_URL` is set correctly

### Approval Link Not Working
- Verify `APPROVAL_SECRET` is the same in all environments
- Check that `FRONTEND_URL` is correct
- Look at Vercel function logs for errors

### Users Can't Login After Approval
- Make sure database columns `approved` and `approved_at` were added correctly
- Check that user's `approved` field is `true` in Supabase

---

## Database Structure

Your `users` table should have these columns:

- `id` (uuid, primary key)
- `email` (text)
- `password` (text) - now stores hashed passwords
- `name` (text)
- `coins` (integer)
- `streak` (integer)
- `sober_since` (timestamp)
- `has_paid` (boolean)
- `approved` (boolean) ← NEW
- `approved_at` (timestamp) ← NEW
- `onboarding_complete` (boolean)
- `onboarding_data` (jsonb)
- `last_check_in` (timestamp)
- `created_at` (timestamp)

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Check Supabase table structure

---

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Keep your Stripe secret key secure
- The approval system ensures you control who accesses your app
- Passwords are now hashed and cannot be read even by you
