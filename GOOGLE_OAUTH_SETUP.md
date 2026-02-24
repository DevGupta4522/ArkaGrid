# Google OAuth Setup for Arka Grid

Complete guide to configure Google OAuth in Google Cloud Console and integrate with your Arka application.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top
3. Click **"New Project"**
4. Enter project name: `Arka Grid` (or your choice)
5. Click **Create**
6. Wait for project to be created (takes ~30 seconds)

---

## Step 2: Enable Google+ API

1. In Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"** or **"Identity"**
3. Click **"Google+ API"** (shows user profile info)
4. Click **Enable**

---

## Step 3: Create OAuth 2.0 Credentials

### For Web Application (Recommended for Arka)

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. You may be asked to configure OAuth consent screen first:
   - Click **"Configure Consent Screen"**
   - Choose **External** user type
   - Click **Create**

### Configure OAuth Consent Screen

1. **App name**: `Arka`
2. **User support email**: your-email@gmail.com
3. **Developer contact**: your-email@gmail.com
4. Click **Save and Continue**

5. **Scopes** (APIs your app needs):
   - Click **Add or Remove Scopes**
   - Search & select:
     - `openid` (OpenID Connect)
     - `email` (User's email)
     - `profile` (User's profile info)
   - Click **Update** → **Save and Continue**

6. **Test users** (optional, for development):
   - Add your test email addresses
   - Click **Save and Continue**

7. Click **Back to Dashboard**

---

## Step 4: Get Your OAuth Credentials

1. Go back to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Enter **Name**: `Arka Web Client`

### Authorized Redirect URIs

Add these exact URLs:

**For Local Development:**
```
http://localhost:3000/auth/v1/callback
http://localhost:3000/auth/callback
```

**For Production (after deployment):**
```
https://your-domain.com/auth/v1/callback
https://your-domain.com/auth/callback
```

(Replace `your-domain.com` with your actual domain)

5. Click **Create**

---

## Step 5: Copy Your Credentials

You'll see a popup with:

### ✅ **Client ID**
```
YOUR_CLIENT_ID.apps.googleusercontent.com
```
- This is a long string like: `123456789-abcdefgh.apps.googleusercontent.com`
- **Copy this** → Use in Supabase & `.env.local`

### ✅ **Client Secret**
```
YOUR_CLIENT_SECRET
```
- Keep this **private** - never share or commit to Git
- You'll need this for Supabase setup
- Click the download icon to save as JSON file

---

## Step 6: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **Arka** project
3. Go to **Authentication** → **Providers**
4. Click **Google**
5. Toggle **Enabled**
6. Paste:
   - **Client ID**: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - **Client Secret**: `YOUR_CLIENT_SECRET`
7. Copy the **Callback URL**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

8. Go back to **Google Cloud Console** → **Credentials**
9. Click your **OAuth client** → Edit
10. Add the Supabase callback URL to **Authorized redirect URIs**:
    ```
    https://your-project-ref.supabase.co/auth/v1/callback
    ```
11. Click **Save**

12. Back in Supabase, click **Save**

---

## Step 7: Test Google OAuth Locally

1. Start your app:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/auth/login`

3. Click **"Sign in with Google"**

4. You should see:
   - Google login popup
   - After login, redirect to `/dashboard`
   - Profile auto-created in Supabase

---

## FAQ: Client ID, Package Name, SHA1 Certificate

### ❓ What is the Client ID?

**Client ID** is your unique identifier from Google:
- Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- Not a secret - safe to include in your app
- Identifies **which app** is requesting access
- Used in `.env.local` and Supabase

### ❓ What is Package Name?

**Package Name** is only needed for **Mobile/Android apps**, not web:
- For **Web Apps** (like Arka): **NOT needed** ✓
- For **Android Apps**: Would be `com.example.arkagrid`
- For **iOS Apps**: Would be `com.example.arkagrid`

Since Arka is a **Next.js web app**, you don't need a package name for Google OAuth.

### ❓ What is SHA1 Signing Certificate?

**SHA1 Signing Certificate** is only for **Android/Mobile apps**:
- For **Web Apps** (Arka): **NOT needed** ✓
- For **Android Apps**: You'd generate a debug or release key
- It's a fingerprint of your app's signing certificate

Since Arka is a **web app**, you don't need SHA1 certificate.

---

## Configuration Summary for Arka (Web App)

| Field | Value | Where to Use |
|-------|-------|--------------|
| **Client ID** | `YOUR_CLIENT_ID.apps.googleusercontent.com` | `.env.local` + Supabase |
| **Client Secret** | `YOUR_CLIENT_SECRET` | **Supabase only** (NOT in .env) |
| **Package Name** | ✗ Not needed | Web apps don't use this |
| **SHA1 Certificate** | ✗ Not needed | Web apps don't use this |
| **Redirect URI** | `http://localhost:3000/auth/v1/callback` | Google Cloud Console |

---

## Update Your .env.local

You don't need to add Google credentials to `.env.local` because Supabase handles them.

Your `.env.local` should only have:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Mapbox (optional)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

**Supabase** handles Google authentication internally.

---

## Troubleshooting

### "Redirect URI mismatch" Error

**Cause**: The redirect URL in your code doesn't match Google Cloud Console

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/v1/callback
   https://your-domain.com/auth/v1/callback
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
4. Save

### "Invalid Client ID" Error

**Fix**:
1. Copy Client ID exactly (no spaces)
2. Verify it's in Supabase with correct format
3. Wait 60 seconds for Supabase to sync

### "Sign in with Google" Button Not Showing

**Fix**:
1. Verify Google provider is **Enabled** in Supabase
2. Check Client ID is filled in Supabase
3. Verify Callback URL is in Google Cloud Console redirects

---

## Next: Local Testing

Once configured:

```bash
npm run dev
# Visit http://localhost:3000/auth/login
# Click "Sign in with Google"
# Complete Google login
# You should be redirected to /dashboard with profile created
```

---

## For Production Deployment

Before deploying to Vercel:

1. Update **Authorized redirect URIs** in Google Cloud:
   ```
   https://arka-grid.vercel.app/auth/v1/callback
   https://your-custom-domain.com/auth/v1/callback
   ```

2. Update Supabase project URL (if different for production)

3. Deploy to Vercel

4. Test production URL: `https://arka-grid.vercel.app/auth/login`

---

You're all set for Google OAuth! 🚀
