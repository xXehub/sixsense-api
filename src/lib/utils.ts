import { customAlphabet } from 'nanoid';

// Generate key dengan format SIX-XXXX-XXXX-XXXX
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nanoid = customAlphabet(alphabet, 4);

export function generateKey(prefix: string = 'SIX'): string {
  return `${prefix}-${nanoid()}-${nanoid()}-${nanoid()}`;
}

// Generate short token untuk script delivery
export function generateToken(): string {
  return customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32)();
}

// Rate limiting map (in-memory, reset on restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetIn: record.resetTime - now 
  };
}

// Simple XOR obfuscation for script (NOT secure, just basic)
export function obfuscateScript(script: string, key: string): string {
  let result = '';
  for (let i = 0; i < script.length; i++) {
    result += String.fromCharCode(
      script.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return Buffer.from(result).toString('base64');
}

// Get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

// Validate HWID format (basic check)
export function isValidHwid(hwid: string): boolean {
  if (!hwid || typeof hwid !== 'string') return false;
  if (hwid.length < 8 || hwid.length > 100) return false;
  if (hwid === 'UNKNOWN' || hwid === 'unknown') return false;
  return true;
}

// Error response helper
export function errorResponse(
  error: string, 
  message: string, 
  status: number = 400
): Response {
  return Response.json(
    { success: false, error, message },
    { status }
  );
}

// Success response helper
export function successResponse(data: object, status: number = 200): Response {
  return Response.json(
    { success: true, ...data },
    { status }
  );
}
