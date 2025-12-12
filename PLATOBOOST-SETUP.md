# Platoboost Integration Setup Guide

## Overview
Integrated Platoboost with support for LootLabs, Linkvertise, and Work.ink providers.
Auto-verification via webhook—no manual token entry needed!

## Files Created

### Backend API Endpoints
- `src/app/api/platoboost/start-session/route.ts` - Create session & get Platoboost URL
- `src/app/api/platoboost/webhook/route.ts` - Receive completion callbacks
- `src/app/api/platoboost/check-session/route.ts` - Frontend polling endpoint

### Frontend
- `src/app/get-key/platoboost/page.tsx` - User-facing key page with provider selection

### Database
- `database/migration-platoboost.sql` - Tables for sessions & callbacks

## Setup Steps

### 1. Run Database Migration
```sql
-- Run this in your Supabase SQL Editor
-- Copy contents from: database/migration-platoboost.sql
```

### 2. Configure Environment Variables
Add to `.env.local`:
```env
# Platoboost API Credentials
PLATOBOOST_API_KEY=your_api_key_here
PLATOBOOST_SECRET_KEY=your_secret_key_here

# Platoboost Link Slugs (get from your dashboard)
PLATOBOOST_LOOTLABS_SLUG=yourname-lootlabs
PLATOBOOST_LINKVERTISE_SLUG=yourname-linkvertise
PLATOBOOST_WORKINK_SLUG=yourname-workink
```

### 3. Configure Platoboost Dashboard

#### For Each Provider Link:
1. Go to Platoboost Dashboard
2. Edit your link (LootLabs/Linkvertise/Work.ink)
3. Set **Callback URL** to:
   ```
   https://your-domain.com/api/platoboost/webhook
   ```
   (For dev with ngrok: `https://xxxx.ngrok-free.app/api/platoboost/webhook`)

4. Enable **POST Callback** method
5. Set **Subid Parameter**: `id` (or whatever Platoboost uses)
6. Save settings

### 4. Test the Flow

1. Start dev server:
   ```bash
   npm run dev
   ```

2. If using ngrok for webhooks:
   ```bash
   ngrok http 3000
   ```

3. Visit: `http://localhost:3000/get-key/platoboost`
4. Select a provider (LootLabs/Linkvertise/Work.ink)
5. Complete the offer
6. Watch the webhook logs in terminal
7. Key appears automatically!

## How It Works

### User Flow
```
1. User visits /get-key/platoboost
2. Selects provider (LootLabs/Linkvertise/Work.ink)
3. Click "Start Offer"
   → Creates session in DB
   → Opens Platoboost gateway with subid=session_id
4. User completes offer on Platoboost
5. Platoboost sends webhook to our backend
   → Backend marks session as completed
6. Frontend polls /api/platoboost/check-session
   → Detects completion
   → Issues key automatically
7. User sees key instantly!
```

### Security Features
- Session expiry (15 minutes)
- IP tracking
- User agent hashing
- Webhook signature verification (if Platoboost provides)
- Callback logging for debugging
- Rate limiting (via existing tables)

## Webhook Payload

Platoboost sends (example):
```json
{
  "subid": "session_id_here",
  "status": "completed",
  "offer_id": "12345",
  "revenue": "0.50",
  "signature": "hmac_signature_if_enabled"
}
```

Our webhook expects:
- `subid` or `id` or `session_id` - to identify session
- `status` - to know completion state
- `signature` (optional) - for verification

## Debugging

### Check Session Status
```sql
SELECT * FROM platoboost_sessions 
WHERE session_id = 'your_session_id' 
ORDER BY created_at DESC;
```

### View Webhook Logs
```sql
SELECT * FROM platoboost_callbacks 
ORDER BY received_at DESC 
LIMIT 10;
```

### Check Security Events
```sql
SELECT * FROM security_events 
WHERE event_type LIKE 'platoboost%' 
ORDER BY created_at DESC;
```

## Troubleshooting

### Webhook Not Received
1. Check Platoboost dashboard callback URL is correct
2. Verify ngrok tunnel is running (for dev)
3. Check firewall/CORS settings
4. Look at `platoboost_callbacks` table for errors

### Session Not Found
1. User might have different IP
2. Session might be expired (15 min)
3. Check `platoboost_sessions` table

### Key Not Issuing
1. Check `platoboost_sessions.status` - should be 'completed'
2. Verify `issued_keys` table has foreign key
3. Check console logs for errors

## API Reference

### POST /api/platoboost/start-session
**Request:**
```json
{
  "provider": "lootlabs",
  "discord_id": "123456789" // optional
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "abc123...",
  "platoboost_url": "https://gateway.platoboost.com/a/yourlink?id=abc123",
  "provider": "lootlabs",
  "expires_in_minutes": 15
}
```

### POST /api/platoboost/webhook
**Receives:** Platoboost callback payload
**Returns:** `{ success: true }`

### GET /api/platoboost/check-session?session_id=xxx
**Response (pending):**
```json
{
  "success": false,
  "pending": true,
  "status": "pending",
  "provider": "lootlabs"
}
```

**Response (completed):**
```json
{
  "success": true,
  "key": "SIXSENSE-ABC123...",
  "status": "completed",
  "provider": "lootlabs"
}
```

## Next Steps

1. Get your Platoboost credentials from their dashboard
2. Create links for each provider (LootLabs, Linkvertise, Work.ink)
3. Configure webhook URLs in Platoboost
4. Test with ngrok first
5. Deploy to production with proper domain
6. Monitor `platoboost_callbacks` table for issues

## Support

If webhook signature verification fails:
- Check `PLATOBOOST_SECRET_KEY` matches dashboard
- Verify webhook payload format with Platoboost docs
- Look at `platoboost_callbacks.verification_status` column

---

**Ready to go!** Just add your Platoboost credentials to `.env.local` and configure the webhook URLs in their dashboard.
