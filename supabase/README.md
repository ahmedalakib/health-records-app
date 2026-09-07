# Sanomed Database & Authentication Foundation (Supabase)

This directory contains the database schema, migrations, and setup instructions for **Sanomed Health Hub**.

---

## 1. Quick Database Setup

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project (or create a new free project).
3. Navigate to **SQL Editor** on the left navigation bar.
4. Click **New query**, paste the entire contents of [`supabase/schema.sql`](./schema.sql), and click **Run**.

### What this migration creates:
- **`profiles` table**: User medical profile (blood group, allergies, emergency contacts, date of birth, phone).
- **`medications` table**: Prescription and medication tracking (dosage, frequency, prescribing doctor, start/end dates).
- **`vitals` table**: Physiological tracking (blood pressure, heart rate, glucose, temperature, oxygen).
- **`visits` table**: Doctor appointment logs and clinical consultation records.
- **`documents` table**: Uploaded medical reports, lab PDF records, and prescriptions.
- **Row-Level Security (RLS)**: Enforced across all tables so users can only access their own medical data (`auth.uid() = user_id`).
- **`handle_new_user()` trigger**: Automatically creates a linked `profiles` record whenever a user registers via email, magic link, or OAuth.
- **Storage Buckets**: Pre-configures `avatars` (public) and `documents` (private, encrypted) buckets with RLS.

---

## 2. Environment Configuration (`.env.local`)

In the root of your project, create or update `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# AI Assistance (Optional)
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Where to find these values:
1. Go to **Project Settings** (gear icon) in the Supabase Dashboard.
2. Select **API**.
3. Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **`anon` `public`** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3. Enable Social Authentication Providers

In the Supabase Dashboard, navigate to **Authentication** -> **Providers**:

### Google
1. Enable the **Google** toggle.
2. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Add the Supabase callback URL (e.g. `https://<your-project-id>.supabase.co/auth/v1/callback`) to **Authorized redirect URIs**.
5. Paste the **Client ID** and **Client Secret** into Supabase.

### Apple
1. Enable the **Apple** toggle.
2. Provide your Apple Developer Service ID, Team ID, Key ID, and private key.
3. Configure the redirect URI provided by Supabase in your Apple Developer portal.

### Facebook
1. Enable the **Facebook** toggle.
2. In the [Meta for Developers](https://developers.facebook.com/) portal, create an App and add Facebook Login.
3. Add the Supabase callback URL to the Valid OAuth Redirect URIs.
4. Paste the **App ID** and **App Secret** into Supabase.

---

## 4. Testing Authentication

- **Login page**: `http://localhost:3000/login`
- **Signup page**: `http://localhost:3000/signup`
- **Passwordless Magic Link**: Enter any valid email on the login page, switch to "Passwordless Magic Link", and click "Send Secure Login Link".
