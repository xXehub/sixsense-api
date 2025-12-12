# Security Architecture - Work.ink Key System

## Overview

This document explains every security measure implemented in our Luarmor-style key system using Work.ink as the offer provider.

**CRITICAL CONTEXT**: Work.ink does NOT provide reliable webhooks. Users receive a TOKEN after completing offers, which they must submit manually to our backend for verification.

---

## Threat Model

### Primary Attack Vectors

1. **Token Brute Forcing** - Attacker tries random tokens
2. **Token Reuse/Replay** - Resubmitting valid tokens multiple times
3. **Token Sharing/Selling** - Users share tokens across accounts
4. **Session Hijacking** - Stealing/guessing session IDs
5. **IP Spoofing** - Bypassing IP checks
6. **Rate Limit Bypass** - Circumventing rate limits
7. **Database Poisoning** - Injecting malicious data

---

## Security Layers

### Layer 1: Session Security

**File**: `src/app/api/workink/start-session/route.ts`

#### 1.1 Cryptographically Random Session IDs

```typescript
const sessionId = crypto.randomBytes(32).toString('hex'); // 64 hex chars
```

**WHY**: 
- 32 bytes = 256 bits of entropy
- 2^256 possible values = ~10^77 combinations
- Computationally infeasible to guess even with quantum computers

**ATTACK PREVENTED**: Session ID guessing/enumeration

---

#### 1.2 User Agent Hashing

```typescript
const userAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');
```

**WHY**:
- Store hash instead of plaintext (privacy + security)
- Detect if session is accessed from different browser/device
- Helps identify session hijacking

**ATTACK PREVENTED**: Session hijacking from different device

**LIMITATION**: User might legitimately switch browsers - we log but don't block

---

#### 1.3 IP Address Capture

```typescript
const ipAddress = getRealIP(request); // x-forwarded-for, x-real-ip, cf-connecting-ip
```

**WHY**:
- Compare against Work.ink token's `byIp` field (soft check)
- Detect if token was obtained from different IP (token sharing/selling)
- Track abuse patterns

**ATTACK PREVENTED**: Token selling/sharing between users

**LIMITATION**: Mobile IPs change, VPNs exist - we use soft-check only

---

#### 1.4 Session Expiry (15 minutes)

```typescript
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
```

**WHY**:
- Limit attack window
- Prevent stale sessions from accumulating
- Force users to complete flow promptly

**ATTACK PREVENTED**: Long-term session hijacking, session enumeration attacks

---

#### 1.5 Duplicate Session Prevention

```typescript
// Check if user already has pending session
const { data: existingSessions } = await supabase
  .from('workink_sessions')
  .eq('discord_id', discord_id)
  .eq('status', 'pending')
  .gte('expires_at', new Date().toISOString());
```

**WHY**:
- One session per user at a time
- Prevent session spam
- Make abuse tracking easier

**ATTACK PREVENTED**: Session flooding, rate limit bypass via multiple sessions

---

### Layer 2: Token Submission Security

**File**: `src/app/api/workink/submit-token/route.ts`

#### 2.1 Rate Limiting (5 attempts / 5 minutes / IP)

```typescript
const { count } = await supabase
  .from('rate_limit_log')
  .eq('ip_address', ipAddress)
  .eq('endpoint', '/api/workink/submit-token')
  .gte('attempted_at', fiveMinutesAgo);

if (count >= 5) {
  return 429 Too Many Requests;
}
```

**WHY**:
- Prevent brute-force token guessing
- Limit automated attacks
- Protect Work.ink API from abuse (we're proxy)

**ATTACK PREVENTED**: Token brute forcing, automated scraping

**TRADEOFF**: Legitimate users might hit limit if they typo token - acceptable

---

#### 2.2 Session Validation

```typescript
// Check session exists
// Check not expired
// Check status still pending
// Check not already completed
```

**WHY**:
- Atomic checks prevent race conditions
- Expired sessions can't be used
- Double-claiming prevented

**ATTACK PREVENTED**: 
- Expired session reuse
- Double claiming same session
- Invalid session abuse

---

#### 2.3 User Agent Consistency Check

```typescript
if (session.user_agent_hash !== currentUserAgentHash) {
  // LOG WARNING but don't block
}
```

**WHY**:
- Detect session hijacking
- Track suspicious behavior
- Useful for forensics

**ATTACK PREVENTED**: Session hijacking from different browser

**LIMITATION**: We log but don't block (user might legitimately switch browsers)

---

### Layer 3: Anti-Replay Protection

**MOST CRITICAL SECURITY FEATURE**

#### 3.1 Token Hashing

```typescript
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
```

**WHY**:
- NEVER store plaintext tokens
- If database is compromised, tokens can't be extracted
- SHA-256 is one-way (can't reverse)

**ATTACK PREVENTED**: Database leak leading to token extraction

---

#### 3.2 Used Tokens Table

```typescript
const { data: usedToken } = await supabase
  .from('used_tokens')
  .eq('token_hash', tokenHash)
  .single();

if (usedToken) {
  return 403 Forbidden; // Token already used
}
```

**WHY**:
- Each token can ONLY be used ONCE
- Prevents token reuse across sessions
- Prevents token sharing/selling

**ATTACK PREVENTED**:
- Token replay attacks
- Token sharing between users
- Token selling on black markets

**CRITICAL**: This is checked BEFORE calling Work.ink API (save API calls)

---

### Layer 4: Work.ink API Verification

#### 4.1 Official API Call

```typescript
const response = await fetch(`https://work.ink/_api/v2/token/isValid/${token}`);
const data = await response.json();

if (!data.valid) {
  return 400 Bad Request; // Invalid token
}
```

**WHY**:
- Work.ink is source of truth
- We don't trust client-submitted tokens
- Cryptographic verification happens on Work.ink side

**ATTACK PREVENTED**: 
- Forged tokens
- Made-up tokens
- Expired tokens (Work.ink checks expiry)

---

#### 4.2 Token Metadata Extraction

```typescript
const { token, createdAt, byIp, linkId, expiresAfter } = data.info;
```

**WHY**:
- `byIp`: Compare against session IP (soft check)
- `linkId`: Verify user completed OUR specific offer
- `createdAt`: Timestamp analysis
- `expiresAfter`: Token TTL (~7 minutes)

**ATTACK PREVENTED**: Cross-site token reuse (token from different offer)

---

### Layer 5: IP Soft-Check

```typescript
const tokenIp = verification.info.byIp;
const sessionIp = session.ip_address;

if (tokenIp !== sessionIp) {
  // LOG WARNING but allow
  console.warn(`IP mismatch: ${sessionIp} vs ${tokenIp}`);
}
```

**WHY**:
- Detect token selling (user A completes offer, sells token to user B)
- Detect VPN switching (suspicious behavior)
- Track abuse patterns

**LIMITATION**: 
- Mobile IPs change frequently (cellular networks)
- Users legitimately use VPNs
- We use SOFT CHECK (log but don't block)

**FUTURE ENHANCEMENT**: 
- Block if IP difference is extreme (different country)
- Machine learning to detect abuse patterns

---

### Layer 6: Key Generation

#### 6.1 Cryptographically Secure Key Format

```typescript
const part1 = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
const part2 = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
const part3 = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
const key = `SIX-${part1}-${part2}-${part3}`;
// Example: SIX-A1B2-C3D4-E5F6
```

**WHY**:
- 6 bytes = 48 bits of entropy
- 2^48 = 281 trillion possible keys
- Impossible to brute force
- Easy to read/copy (human-friendly format)

**ATTACK PREVENTED**: Key guessing, key enumeration

---

#### 6.2 One Key Per Session (Idempotent)

```typescript
if (session.status === 'key_issued') {
  // Return existing key
  return existingKey;
}
```

**WHY**:
- User can't claim multiple keys from one session
- Prevents double-claiming
- Makes system idempotent (safe to retry)

**ATTACK PREVENTED**: Multiple key claims from single session

---

### Layer 7: Comprehensive Logging

**Table**: `security_events`

```typescript
await supabase.from('security_events').insert({
  event_type: 'token_verified',
  severity: 'info',
  message: 'Token verified successfully',
  session_id: session_id,
  ip_address: ipAddress,
  metadata: { ...details }
});
```

**Events Logged**:
- `session_created` - User clicked START
- `token_submitted` - User submitted token
- `token_verified` - Token passed verification
- `token_rejected` - Invalid token
- `rate_limit_hit` - Too many attempts
- `replay_attempt` - Used token resubmitted
- `ip_mismatch` - Session IP ≠ token IP
- `ua_mismatch` - Browser changed
- `key_issued` - Key generated

**WHY**:
- Audit trail for compliance
- Forensic analysis of attacks
- Pattern detection (ML/AI in future)
- Real-time alerting capability

---

## Attack Scenarios & Defenses

### Scenario 1: Brute Force Token Guessing

**Attack**: Attacker submits random tokens hoping to guess valid one

**Defense Stack**:
1. ✅ Rate limiting (5 attempts / 5 minutes / IP)
2. ✅ Token format validation (length check)
3. ✅ Session validation (must have valid session)
4. ✅ Work.ink API verification (token must be real)

**Result**: Infeasible (would need billions of years)

---

### Scenario 2: Token Replay Attack

**Attack**: User completes offer, gets token, uses it multiple times

**Defense Stack**:
1. ✅ Token hash stored in `used_tokens` table
2. ✅ Check happens BEFORE API call (fail fast)
3. ✅ Database constraint (UNIQUE on token_hash)
4. ✅ Security event logged

**Result**: Blocked at database level

---

### Scenario 3: Token Selling

**Attack**: User A completes offer, sells token to User B

**Defense Stack**:
1. ⚠️ IP soft-check (different IPs logged but not blocked)
2. ✅ Used token tracking (token only works once)
3. ✅ Security event logged for analysis

**Result**: Partially mitigated (logged for forensics)

**LIMITATION**: Hard to fully prevent without blocking VPN users

---

### Scenario 4: Session Hijacking

**Attack**: Attacker steals session ID, submits token before victim

**Defense Stack**:
1. ✅ 64-char random session ID (infeasible to guess)
2. ✅ 15-minute expiry (small attack window)
3. ✅ User agent hash check (browser fingerprinting)
4. ✅ IP address logging
5. ✅ One token per session

**Result**: Extremely difficult (attacker needs session ID + token)

---

### Scenario 5: Database Compromise

**Attack**: Attacker gains read access to database

**What's Protected**:
- ✅ Tokens are hashed (SHA-256, can't reverse)
- ✅ User agents are hashed
- ⚠️ Session IDs are plaintext (needed for lookups)
- ⚠️ IP addresses are plaintext (needed for checks)

**Result**: Tokens can't be extracted even with DB access

---

## Best Practices Implemented

### 1. Defense in Depth
Multiple layers of security - if one fails, others still protect

### 2. Fail Secure
If validation fails, reject by default (never assume trust)

### 3. Least Privilege
No client-side secrets, all verification server-side

### 4. Audit Logging
Comprehensive event logging for forensics and compliance

### 5. Rate Limiting
Protect against automated attacks and API abuse

### 6. Input Validation
Validate all user inputs before processing

### 7. Cryptographic Randomness
Use `crypto.randomBytes()` for all random generation

### 8. Hash Sensitive Data
Never store plaintext tokens, passwords, or secrets

---

## Limitations & Tradeoffs

### 1. IP Soft-Check Only
**Limitation**: Can't block IP mismatches (VPNs, mobile networks)
**Tradeoff**: Better UX vs stricter security
**Mitigation**: Log for analysis, future ML-based detection

### 2. User Agent Check is Soft
**Limitation**: User might legitimately switch browsers
**Tradeoff**: Convenience vs security
**Mitigation**: Log warnings, don't block

### 3. No CAPTCHA (yet)
**Limitation**: Automated bots could potentially abuse
**Tradeoff**: Better UX vs bot protection
**Future**: Add CAPTCHA if abuse detected

### 4. Work.ink API Dependency
**Limitation**: If Work.ink API is down, system breaks
**Mitigation**: Fallback mechanisms, caching valid tokens

---

## Configuration

### Environment Variables Required

```env
WORKINK_LINK_ID=1058127           # Your Work.ink offer link ID
SUPABASE_URL=https://...          # Supabase project URL
SUPABASE_ANON_KEY=...             # Supabase anon key
```

### Database Setup

Run `database/schema-workink-secure.sql` to create:
- `workink_sessions` - Session tracking
- `used_tokens` - Anti-replay protection
- `issued_keys` - Generated keys
- `rate_limit_log` - Rate limiting
- `security_events` - Audit log

---

## Monitoring & Alerts

### Key Metrics to Track

1. **Token Submission Rate**
   - Spike = potential attack
   - Drop = Work.ink issues

2. **Rejection Rate**
   - High rate = users confused or attack

3. **IP Mismatch Rate**
   - High rate = token sharing/selling

4. **Rate Limit Hits**
   - Frequent hits = automated attack

5. **Session Expiry Rate**
   - High rate = UX issue (15min too short?)

### Alert Thresholds

- ⚠️ Warning: >10 rate limit hits / minute
- 🚨 Critical: >50 token replays / hour
- 🚨 Critical: >100 IP mismatches / hour

---

## Incident Response

### If Token Leak Detected:

1. Immediately rotate `WORKINK_LINK_ID` (new offer)
2. Mark all pending sessions as expired
3. Clear `used_tokens` table (force re-verification)
4. Analyze `security_events` for breach source

### If Abuse Detected:

1. Check `security_events` for patterns
2. Block IP if targeted attack
3. Increase rate limit strictness temporarily
4. Contact Work.ink if their side is compromised

---

## Code Audit Checklist

- [x] All random IDs use `crypto.randomBytes()`
- [x] No secrets in client-side code
- [x] All user inputs validated server-side
- [x] SQL injection prevented (Supabase prepared statements)
- [x] XSS prevented (React escapes by default)
- [x] CSRF tokens not needed (stateless API)
- [x] Rate limiting on sensitive endpoints
- [x] Comprehensive logging of security events
- [x] Sensitive data hashed (tokens, user agents)
- [x] Session expiry enforced
- [x] Anti-replay protection implemented
- [x] Error messages don't leak info
- [x] HTTPS enforced (production)

---

## Compliance

### GDPR Considerations

- IP addresses are personal data (pseudonymous)
- User agents are stored as hashes (anonymized)
- Users should be notified of data collection
- Data retention policy: 7 days for security events

### Data Retention

- Active sessions: 15 minutes (auto-expire)
- Expired sessions: 7 days (then deleted)
- Used tokens: 24 hours (then deleted)
- Security events: 30 days (configurable)
- Issued keys: Until expiry + 7 days

---

## Future Enhancements

1. **Machine Learning**: Detect abuse patterns automatically
2. **Stricter IP Checks**: Block suspicious IP changes
3. **Device Fingerprinting**: More robust than user agent
4. **CAPTCHA**: Add if bot abuse detected
5. **Blockchain**: Store used token hashes on-chain (immutable)
6. **Multi-Factor**: Optional 2FA for high-value keys

---

## Conclusion

This system implements **defense in depth** with multiple security layers:
- Cryptographically secure IDs
- Anti-replay protection
- Rate limiting
- Server-side verification
- Comprehensive logging

**No system is 100% secure**, but this architecture makes attacks:
- Computationally infeasible (token guessing)
- Economically unviable (too much effort)
- Easily detectable (comprehensive logging)

Security is a process, not a product. Continuous monitoring and improvement are essential.
