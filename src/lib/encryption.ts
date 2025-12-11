import CryptoJS from 'crypto-js';

/**
 * Luarmor-style Script Encryption System
 * Encrypts Lua scripts and generates decoder
 */

// Generate random encryption key
export function generateEncryptionKey(accessKey: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return CryptoJS.SHA256(accessKey + timestamp + random).toString();
}

// XOR encryption helper - returns byte array
// IMPORTANT: Use UTF-8 encoding to handle obfuscated scripts with special chars
function xorEncrypt(text: string, key: string): number[] {
  // Convert text to UTF-8 byte array
  const textBytes = Buffer.from(text, 'utf8');
  const keyBytes = Buffer.from(key, 'utf8');
  
  const result: number[] = [];
  for (let i = 0; i < textBytes.length; i++) {
    result.push(textBytes[i] ^ keyBytes[i % keyBytes.length]);
  }
  return result;
}

// Convert byte array to Lua table string
function toLuaArray(bytes: number[]): string {
  return `{${bytes.join(',')}}`;
}

// AES encryption (stronger than XOR)
export function aesEncrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString();
}

// Generate Lua decoder with ENVIRONMENT CHECKS + ANTI-TAMPER + DYNAMIC KEY
export function generateLuaDecoder(encryptedData: string, encryptionKey: string, accessKey: string): string {
  const halfKey = encryptionKey.substring(0, Math.floor(encryptionKey.length / 2));
  const keyBytes = Array.from(Buffer.from(halfKey, 'utf8'));
  const keyArray = `{${keyBytes.join(',')}}`;
  const checksum = CryptoJS.MD5(encryptionKey).toString().substring(0, 8);
  const flag = `_SS_${accessKey.substring(0, 8)}`;
  
  // Minified decoder for production
  return `return function(d)
if not game or not bit32 or not loadstring then return end
if getgenv and getgenv()._DEBUG then return end
local f="${flag}"
if getgenv and getgenv()[f]then return warn("Already executed")end
local e,k=d[1],d[2]or{}
local s=${keyArray}
local c={}
for i=1,#s do c[i]=s[i]end
for i=1,#k do c[#c+1]=k[i]end
local r,l={},#c
if l==0 then return end
for i=1,#e do r[i]=string.char(bit32.bxor(e[i],c[((i-1)%l)+1]))end
local x,err=loadstring(table.concat(r))
if x then
if getgenv then getgenv()[f]=true end
local ok,res=pcall(x)
if ok then return res else if getgenv then getgenv()[f]=nil end return warn(tostring(res))end
else return warn(tostring(err))end
end
`;
}

// Generate encrypted loader - minified for production
export function generateEncryptedLoader(
  encryptedArray: string,
  dynamicKeyArray: string,
  accessKey: string,
  baseUrl: string,
  requireKey: boolean
): string {
  const cacheKey = CryptoJS.MD5(accessKey + 'v3').toString().substring(0, 16);
  const decoderUrl = `${baseUrl}/api/decoder/${accessKey}`;
  const watermark = `-- Protected by SixSense | ${new Date().toISOString().split('T')[0]}`;
  
  if (!requireKey) {
    // Without key validation - minified
    return `${watermark}
local _D={{${encryptedArray}},{${dynamicKeyArray}}}
pcall(function()delfile('sixsense/${cacheKey}.lua')end)
pcall(makefolder,"sixsense")
local _s=game:HttpGet("${decoderUrl}")
local _f=loadstring(_s)
if _f then local _r=_f()if _r then return _r(_D)end end
return warn("[SixSense] Load failed")`;
  }
  
  // With key validation - minified
  return `${watermark}
local H=game:GetService("HttpService")
local K=(getgenv and getgenv().SIXSENSE_KEY)or _G.SIXSENSE_KEY
if not K then return warn("[SixSense] No key")end
local s,r=pcall(function()return game:HttpGet("${baseUrl}/api/validate/key?key="..K.."&script=${accessKey}")end)
if not s or not r then return warn("[SixSense] Validation failed")end
local d=H:JSONDecode(r)
if not d.valid then return warn("[SixSense] "..tostring(d.error or"Invalid"))end
print("[SixSense] ✓ "..(d.username or""))
local _D={{${encryptedArray}},{${dynamicKeyArray}}}
pcall(function()delfile('sixsense/${cacheKey}.lua')end)
pcall(makefolder,"sixsense")
local _s=game:HttpGet("${decoderUrl}")
local _f=loadstring(_s)
if _f then local _r=_f()if _r then return _r(_D)end end
return warn("[SixSense] Load failed")`;
}

// Main encryption function - USES PROVIDED KEY (from database)
export function encryptScript(
  script: string,
  accessKey: string,
  requireKey: boolean,
  baseUrl: string,
  encryptionKey: string // Key from database - MUST be consistent with decoder
): { loader: string; decoder: string; dynamicKey: string } {
  // Use provided encryption key (from database) - ensures loader and decoder use same key
  
  // Split key: half in loader, half from server (use UTF-8 bytes)
  const dynamicKeyPart = encryptionKey.substring(Math.floor(encryptionKey.length / 2));
  const dynamicKeyBytes = Array.from(Buffer.from(dynamicKeyPart, 'utf8'));
  
  // Encrypt script content with XOR - returns byte array
  const encrypted = xorEncrypt(script, encryptionKey);
  
  // Generate decoder (with env checks + anti-tamper)
  const decoder = generateLuaDecoder('', encryptionKey, accessKey);
  
  // Generate loader (with dynamic key) - pass raw arrays, not strings
  const loader = generateEncryptedLoader(
    encrypted.join(','),
    dynamicKeyBytes.join(','),
    accessKey, 
    baseUrl, 
    requireKey
  );
  
  return { loader, decoder, dynamicKey: dynamicKeyPart };
}
