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
  const flag = `_SIXSENSE_${accessKey.substring(0, 8)}`;
  
  return `return function(data)
if not game or not bit32 or not loadstring then return end
if getgenv and getgenv()._DEBUG then return end
local flag = "${flag}"
if getgenv and getgenv()[flag] then 
    return warn("[SixSense] Script already executed") 
end
local encrypted = data[1]
local dynamic_key = data[2] or {}
local static_key = ${keyArray}
local full_key = {}
for i = 1, #static_key do
    full_key[i] = static_key[i]
end
for i = 1, #dynamic_key do
    full_key[#full_key + 1] = dynamic_key[i]
end
local result = {}
local key_len = #full_key
if key_len == 0 then return end
for i = 1, #encrypted do
    result[i] = string.char(bit32.bxor(encrypted[i], full_key[((i - 1) % key_len) + 1]))
end
local func, err = loadstring(table.concat(result))
if func then
    if getgenv then getgenv()[flag] = true end
    local success, res = pcall(func)
    if success then 
        return res 
    else 
        if getgenv then getgenv()[flag] = nil end 
        return warn("[SixSense] Script error: " .. tostring(res))
    end
else 
    return warn("[SixSense] Decode error: " .. tostring(err))
end
end
`;
}

// Generate encrypted loader - compact but readable
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
    // Without key validation
    return `${watermark}
local _DATA = {{${encryptedArray}}, {${dynamicKeyArray}}}
pcall(function() delfile('sixsense/${cacheKey}.lua') end)
pcall(makefolder, "sixsense")
local decoder_str = game:HttpGet("${decoderUrl}")
local decoder_func = loadstring(decoder_str)
if decoder_func then
    local decoder = decoder_func()
    if decoder then return decoder(_DATA) end
end
return warn("[SixSense] Failed to load decoder")`;
  }
  
  // With key validation
  return `${watermark}
local HttpService = game:GetService("HttpService")
local KEY = (getgenv and getgenv().SIXSENSE_KEY) or _G.SIXSENSE_KEY
if not KEY then return warn("[SixSense] No key found") end
local success, response = pcall(function()
    return game:HttpGet("${baseUrl}/api/validate/key?key=" .. KEY .. "&script=${accessKey}")
end)
if not success or not response then return warn("[SixSense] Validation failed") end
local data = HttpService:JSONDecode(response)
if not data.valid then return warn("[SixSense] Invalid key: " .. (data.error or "Unknown")) end
print("[SixSense] ✓ " .. (data.username or "User"))
local _DATA = {{${encryptedArray}}, {${dynamicKeyArray}}}
pcall(function() delfile('sixsense/${cacheKey}.lua') end)
pcall(makefolder, "sixsense")
local decoder_str = game:HttpGet("${decoderUrl}")
local decoder_func = loadstring(decoder_str)
if decoder_func then
    local decoder = decoder_func()
    if decoder then return decoder(_DATA) end
end
return warn("[SixSense] Failed to load decoder")`;
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
