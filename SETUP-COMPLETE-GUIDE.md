# Work.ink Token-Based Key System - Complete Setup Guide

## Overview

This guide will help you set up a secure, Luarmor-style key system using Work.ink's token-based verification (NOT webhooks).

**Flow**: User clicks START → Completes offer on Work.ink → Gets TOKEN → Submits token to your site → Receives KEY

---

## Prerequisites

- ✅ Supabase account with project created
- ✅ Work.ink publisher account
- ✅ Next.js app deployed (Vercel/Railway/etc)
- ✅ Node.js 18+ installed locally

---

## Step 1: Work.ink Configuration

### 1.1 Create Work.ink Account

1. Go to https://work.ink
2. Sign up as a Publisher
3. Complete account verification

### 1.2 Get Your Link ID

1. Login to Work.ink dashboard
2. Go to **Developer** → **Key System**
3. Create a new key or use existing
4. Your Link ID is shown in the dashboard (example: `ffa01de-f94a-4b1a-bb5d-d65ffc42b4b0`)

**IMPORTANT**: This is an API KEY from Work.ink, NOT a numeric link ID!

### 1.3 Configure Work.ink Key System

1. Set key display name (e.g., "SixSense Script Key")
2. Configure key expiry time (recommended: 24 hours)
3. Save configuration

**Note**: Work.ink's "Key System" feature generates tokens that users receive after completing offers. This is different from their offer link system.

---

## Step 2: Database Setup

### 2.1 Run Schema

1. Open Supabase SQL Editor
2. Copy contents of `database/schema-workink-secure.sql`
3. Execute the entire script

This creates:
- `workink_sessions` - Track user sessions
- `used_tokens` - Anti-replay protection  
- `issued_keys` - Generated keys
- `rate_limit_log` - Abuse prevention
- `security_events` - Audit logging

### 2.2 Verify Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'workink_sessions',
    'used_tokens',
    'issued_keys',
    'rate_limit_log',
    'security_events'
  );
```

Should return 5 rows.

### 2.3 Set Up Row Level Security (Optional but Recommended)

```sql
-- Enable RLS
ALTER TABLE workink_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_keys ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust for your auth setup)
CREATE POLICY "Service role can do everything" ON workink_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Repeat for other tables
```

---

## Step 3: Environment Configuration

### 3.1 Create `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Work.ink
WORKINK_LINK_ID=ffa01de-f94a-4b1a-bb5d-d65ffc42b4b0  # Your API key from Work.ink dashboard
WORKINK_LINK_SLUG=sixsense                            # Your custom slug

# App
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Discord OAuth (if using)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

### 3.2 Production Environment Variables

In your hosting platform (Vercel/Railway), add the same variables.

**CRITICAL**: Never commit `.env.local` to Git!

---

## Step 4: Install Dependencies

```bash
cd sixsense-api
npm install
```

Required packages (should already be in `package.json`):
- `next` (^16.0.0)
- `react` (^19.0.0)
- `@supabase/supabase-js` (^2.x)
- `crypto` (built-in Node.js)

---

## Step 5: Test Locally

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Flow

1. **Open**: http://localhost:3000/get-key/workink

2. **Click START**:
   - Should create session
   - Redirect to Work.ink
   
3. **Check Database**:
   ```sql
   SELECT * FROM workink_sessions ORDER BY created_at DESC LIMIT 1;
   ```

4. **Complete Offer on Work.ink**:
   - Follow offer instructions
   - Get TOKEN from Work.ink

5. **Open**: http://localhost:3000/submit-token?sr=YOUR_SESSION_ID

6. **Submit Token**:
   - Paste token
   - Click Submit

7. **Verify Key Issued**:
   ```sql
   SELECT * FROM issued_keys ORDER BY created_at DESC LIMIT 1;
   ```

---

## Step 6: Security Checklist

- [ ] All environment variables set
- [ ] Supabase RLS enabled (if using public APIs)
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured
- [ ] Security events logging active
- [ ] Session cleanup cron job scheduled
- [ ] Error messages don't leak sensitive info
- [ ] No secrets in client-side code

---

## Step 7: Deploy to Production

### 7.1 Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 7.2 Set Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy

### 7.3 Configure Supabase

1. Update Supabase project URL allowlist
2. Add production domain to CORS settings

---

## Step 8: Monitoring Setup

### 8.1 Enable Supabase Logs

1. Go to Supabase Dashboard → Logs
2. Enable query logging
3. Set up alerts for errors

### 8.2 Monitor Key Metrics

Create database views for monitoring:

```sql
-- Sessions created per day
CREATE VIEW daily_sessions AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as session_count,
  COUNT(*) FILTER (WHERE status = 'key_issued') as successful
FROM workink_sessions
GROUP BY DATE(created_at);

-- Token rejection rate
CREATE VIEW token_rejection_rate AS
SELECT 
  COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*) as rejection_rate
FROM rate_limit_log
WHERE endpoint = '/api/workink/submit-token';
```

### 8.3 Set Up Alerts

Create alerts for:
- ⚠️ Token rejection rate > 50%
- 🚨 Rate limit hits > 100/hour
- 🚨 IP mismatches > 50/hour

---

## Step 9: Cleanup Jobs

### 9.1 Create Supabase Edge Function (Cron)

```sql
-- Run every hour via pg_cron
SELECT cron.schedule(
  'expire-old-sessions',
  '0 * * * *', -- Every hour
  $$SELECT expire_old_sessions()$$
);

SELECT cron.schedule(
  'cleanup-old-sessions',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_old_sessions()$$
);
```

### 9.2 Alternative: Vercel Cron

Create `pages/api/cron/cleanup.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Expire old sessions
  await supabase.rpc('expire_old_sessions');
  
  // Cleanup old data
  await supabase.rpc('cleanup_old_sessions');

  res.json({ success: true });
}
```

Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Step 10: User Documentation

### 10.1 Create User Guide

Create `public/help/get-key.md`:

```markdown
# How to Get a Free Key

1. Click **START** button
2. Complete a simple task on Work.ink (takes 2-3 minutes)
3. Copy the TOKEN shown after completion
4. Return to this site and paste your token
5. Receive your FREE key instantly!

## FAQ

**Q: I didn't receive a token**
A: Make sure you completed ALL steps of the offer

**Q: My token says "invalid"**
A: Tokens expire after 7 minutes - get a new one

**Q: Can I use the same token twice?**
A: No, each token works only once for security

## Support

Join our Discord: [link]
```

---

## Troubleshooting

### Issue 1: "Provider not found"

**Cause**: Database tables not created

**Solution**:
```sql
-- Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'workink_sessions'
);
```

If false, run `schema-workink-secure.sql` again.

---

### Issue 2: "Invalid token" on valid token

**Cause**: Work.ink API might be down or token format changed

**Solution**:
1. Test Work.ink API directly:
   ```bash
   curl https://work.ink/_api/v2/token/isValid/YOUR_TOKEN
   ```

2. Check response format matches our code

---

### Issue 3: Rate limit triggered unexpectedly

**Cause**: User trying multiple times with typos

**Solution**:
- Increase limit to 10 attempts / 5 minutes
- Add clearer error messages
- Show remaining attempts

```typescript
const MAX_ATTEMPTS = 10; // Increase from 5
```

---

### Issue 4: IP mismatch warnings

**Cause**: Mobile network IP changes

**Solution**: This is expected - we log but don't block. If abuse is detected, implement stricter checks:

```typescript
if (tokenIp !== sessionIp) {
  // Check if IPs are from same country/region
  const ipinfoSession = await fetch(`https://ipinfo.io/${sessionIp}/json`);
  const ipinfoToken = await fetch(`https://ipinfo.io/${tokenIp}/json`);
  
  if (ipinfoSession.country !== ipinfoToken.country) {
    return res.status(403).json({ error: 'Suspicious IP change detected' });
  }
}
```

---

## Performance Optimization

### 1. Add Database Indexes

Indexes are already created in schema, but verify:

```sql
-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('workink_sessions', 'used_tokens', 'issued_keys');
```

### 2. Enable Supabase Edge Functions

Move API routes to edge functions for lower latency.

### 3. Cache Work.ink API Responses

```typescript
// Cache valid token responses for 5 minutes
const cacheKey = `workink_token_${tokenHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

---

## Scaling Considerations

### For 1,000+ users/day

1. **Database**: Use Supabase Pro plan
2. **API Limits**: Work.ink might rate limit - implement queue
3. **Caching**: Use Redis for rate limit checks
4. **CDN**: Enable Vercel Edge Network

### For 10,000+ users/day

1. **Load Balancing**: Multiple API instances
2. **Database Replication**: Read replicas for analytics
3. **Queue System**: Bull/BullMQ for token verification
4. **Monitoring**: Datadog/New Relic for APM

---

## Cost Estimates

### Supabase
- Free tier: 500MB database, 2GB bandwidth
- Pro: $25/month - 8GB database, 250GB bandwidth

### Vercel
- Hobby: Free - 100GB bandwidth
- Pro: $20/month - 1TB bandwidth

### Work.ink
- Free for publishers (they make money from offers)

**Total**: $0-50/month depending on scale

---

## Support & Resources

- 📚 Documentation: `/SECURITY.md`, `/WORKINK-INTEGRATION.md`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Your Discord Server]
- 📧 Email: support@yoursite.com

---

## License

MIT License - Use freely in your projects

---

## Credits

Built with:
- Next.js 16
- Supabase
- Work.ink
- TypeScript
- TailwindCSS

Inspired by Luarmor's key system architecture.
