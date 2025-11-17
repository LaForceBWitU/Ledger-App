# 🔧 DEBUGGING GUIDE - Account Creation Not Working

## Problem Summary
1. ❌ Payment page doesn't show (skips straight to create account)
2. ❌ Creating account does nothing (no redirect, no emails)

---

## 🔍 Step 1: Are You Testing Locally or on Vercel?

### If Testing Locally:

**IMPORTANT:** You MUST use `npx vercel dev` (not `npm run dev`)

```bash
# ❌ WRONG - API endpoints won't work
npm run dev

# ✅ CORRECT - API endpoints will work
npx vercel dev
```

**Why?** The `/api` endpoints are serverless functions that only work with Vercel's dev server.

---

## 🧹 Step 2: Clear Your Browser Cache

Your browser is remembering old test data. Open your browser:

1. **Open DevTools**: Press `F12`
2. **Go to Console tab**
3. **Paste this and press Enter:**
   ```javascript
   localStorage.clear(); location.reload();
   ```

This resets everything and shows the payment page again.

---

## ✅ Step 3: Test Payment Flow (Local)

### Start Vercel Dev Server:
```bash
cd /home/user/Ledger-App
npx vercel dev
```

### Visit Local Site:
Go to: **http://localhost:3000** (NOT 5173)

### You Should See:
1. ✅ Payment page with $19 button
2. Click button → Should show Stripe error (expected - need correct Price ID)

### If You DON'T See Payment Page:
- Clear localStorage again (F12 → Console → `localStorage.clear(); location.reload();`)
- Make sure you're on `http://localhost:3000` (Vercel dev port)

---

## 🚀 Step 4: Test on Vercel (Deployed)

### First, Check Your Deployment:

1. **Go to:** https://vercel.com/dashboard
2. **Open your project**
3. **Check "Deployments" tab**
4. **Is the latest commit deployed?**
   - Latest commit should be: "Fix Stripe payment error and replace Mailgun with Resend"

### If NOT Deployed:
```bash
git add .
git commit -m "Add Vercel config"
git push
```

Then wait 1-2 minutes for Vercel to deploy.

---

## 🔑 Step 5: Verify Environment Variables (Vercel)

Go to: **Settings → Environment Variables** in Vercel dashboard

### Required Variables:
```
✅ STRIPE_SECRET_KEY=sk_live_51STqsFRbE7vY4nMM...
✅ STRIPE_PRICE_ID=price_...  (NOT prod_... !)
✅ RESEND_API_KEY=re_...
✅ OWNER_EMAIL=BundleUpMontana@gmail.com
✅ SUPABASE_URL=https://aikbdtyzigeszkrozdng.supabase.co
✅ SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ FRONTEND_URL=https://your-app-name.vercel.app
✅ APPROVAL_SECRET=ledger-app-approval-secret-change-this-in-production
```

### Critical Ones to Check:
- **STRIPE_PRICE_ID**: Must start with `price_` (NOT `prod_`)
- **RESEND_API_KEY**: Must start with `re_`
- **FRONTEND_URL**: Must be your actual Vercel URL

### After Changing Variables:
You MUST redeploy! Vercel doesn't auto-reload environment variables.

Go to: **Deployments** → Click the three dots `...` → **Redeploy**

---

## 🧪 Step 6: Test Account Creation

### Test Locally First:

1. **Start Vercel dev:**
   ```bash
   npx vercel dev
   ```

2. **Visit:** http://localhost:3000

3. **Clear localStorage:**
   - F12 → Console → `localStorage.setItem('ledgerHasPaid', 'true'); location.reload();`
   - This skips payment for testing

4. **Fill out create account form:**
   - Email: test@example.com
   - Password: test123
   - Confirm: test123

5. **Click "Create Account"**

### What Should Happen:
- ✅ Console shows "Creating account..."
- ✅ Console shows API call to `/api/notify-owner`
- ✅ Page changes to "Account Created!" with pending approval message

### If Nothing Happens:
Open browser console (F12) and check for errors.

**Common Errors:**

1. **"Failed to fetch"** = API endpoint not running
   - Solution: Make sure you're using `npx vercel dev`

2. **"RESEND_API_KEY not configured"** = Missing env variable
   - Solution: Add it to your `.env` file

3. **"Network error"** = Wrong URL
   - Solution: Check you're on `http://localhost:3000`

---

## 📧 Step 7: Test Email Sending

Emails won't work unless:

1. ✅ You signed up for Resend: https://resend.com/signup
2. ✅ You got an API key from: https://resend.com/api-keys
3. ✅ You added it to `.env` as `RESEND_API_KEY=re_...`

### To Test Email Without Resend:

For now, you can skip email testing. The account will still be created in the database.

### Check if Account Was Created:

1. Go to: **Supabase Dashboard** → https://supabase.com/dashboard
2. Go to: **Table Editor** → **users** table
3. Look for your test account
4. **If it's there** = Account creation works! Emails just need Resend setup.

---

## 🔥 Quick Fix Checklist

Try these in order:

1. [ ] **Clear localStorage:**
   ```javascript
   localStorage.clear(); location.reload();
   ```

2. [ ] **Use Vercel Dev (not npm run dev):**
   ```bash
   npx vercel dev
   ```

3. [ ] **Visit correct port:**
   - http://localhost:3000 (Vercel dev)
   - NOT http://localhost:5173 (Vite dev)

4. [ ] **Check Vercel deployment:**
   - Latest code deployed?
   - Environment variables set?

5. [ ] **Get Stripe Price ID:**
   - https://dashboard.stripe.com/products
   - Copy Price ID (starts with `price_`)
   - Update in Vercel environment variables

6. [ ] **Sign up for Resend:**
   - https://resend.com/signup
   - Get API key
   - Add to Vercel environment variables

7. [ ] **Redeploy after env changes:**
   - Vercel Dashboard → Deployments → Redeploy

---

## 🆘 Still Not Working?

### Share These With Me:

1. **Are you testing locally or on Vercel?**

2. **What URL are you using?**
   - http://localhost:3000?
   - http://localhost:5173?
   - https://your-app.vercel.app?

3. **What page do you see?**
   - Payment page ($19)?
   - Create account page?
   - Something else?

4. **Browser console errors** (F12 → Console tab)
   - Copy and paste any red errors

5. **Have you deployed to Vercel?**
   - When was the last deployment?

6. **Environment variables**
   - Is STRIPE_PRICE_ID a Price ID (starts with `price_`)?
   - Is RESEND_API_KEY set (starts with `re_`)?

---

## 📝 Expected Flow

Here's what SHOULD happen when everything works:

1. **Visit site** → See payment page ($19)
2. **Click "Get Lifetime Access"** → Redirect to Stripe checkout
3. **Complete payment** → Redirect back to site
4. **See "Create Account" page** → Fill out form
5. **Click "Create Account"** → See "Account Created! Pending approval" message
6. **Owner (you) receives email** → With approval link
7. **User receives email** → Explaining they're pending approval
8. **You click approve link** → User approved
9. **User receives approval email** → Can now login
10. **User logs in** → Access the app

---

**Current Status:** You're stuck at step 4-5 (account creation not working)

**Most Likely Cause:** Testing with `npm run dev` instead of `npx vercel dev`, or API endpoints not deployed to Vercel.
