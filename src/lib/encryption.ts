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
function xorEncrypt(text: string, key: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++) {
    result.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
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

// Generate Lua decoder script - PROVEN WORKING VERSION
export function generateLuaDecoder(encryptedData: string, encryptionKey: string, accessKey: string): string {
  // Convert key to byte array for Lua
  const keyBytes = Array.from(encryptionKey).map(c => c.charCodeAt(0));
  const keyArray = `{${keyBytes.join(',')}}`;
  
  // Simple, proven decoder that works in Roblox
  return `return function(data)
local encrypted = data[1]
local key = ${keyArray}
local result = {}
local keyLen = #key
for i = 1, #encrypted do
    local encByte = encrypted[i]
    local keyByte = key[((i - 1) % keyLen) + 1]
    table.insert(result, string.char(bit32.bxor(encByte, keyByte)))
end
local decrypted = table.concat(result)
local func = loadstring(decrypted)
if func then
    return func()
else
    warn("[SixSense] Failed to load script")
end
end`;
}

// Generate encrypted loader - NEW APPROACH with byte arrays
export function generateEncryptedLoader(
  encryptedArray: string,
  accessKey: string,
  baseUrl: string,
  requireKey: boolean
): string {
  const cacheKey = CryptoJS.MD5(accessKey).toString().substring(0, 16);
  const decoderUrl = `${baseUrl}/api/decoder/${accessKey}`;
  
  const watermark = `-- Protected by SixSense | ${new Date().toISOString().split('T')[0]}`;
  
  if (!requireKey) {
    // Without key validation
    return `${watermark}
local _DATA=${encryptedArray}
pcall(function() delfile('${cacheKey}.lua') end)
local _DECODER
local _SUCCESS = pcall(function()
    _DECODER = readfile("sixsense/${cacheKey}.lua")
end)
if _SUCCESS and _DECODER and #_DECODER > 100 then
    _DECODER = loadstring(_DECODER)
end
if _DECODER then
    return _DECODER()({_DATA})
else
    pcall(makefolder, "sixsense")
    _DECODER = game:HttpGet("${decoderUrl}")
    writefile("sixsense/${cacheKey}.lua", _DECODER)
    return loadstring(_DECODER)()({_DATA})
end`;
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
if not data.valid then return warn("[SixSense] Invalid key") end
print("[SixSense] Validated: " .. (data.username or "User"))
local _DATA=${encryptedArray}
pcall(function() delfile('${cacheKey}.lua') end)
local _DECODER
local _SUCCESS = pcall(function()
    _DECODER = readfile("sixsense/${cacheKey}.lua")
end)
if _SUCCESS and _DECODER and #_DECODER > 100 then
    _DECODER = loadstring(_DECODER)
end
if _DECODER then
    return _DECODER()({_DATA})
else
    pcall(makefolder, "sixsense")
    _DECODER = game:HttpGet("${decoderUrl}")
    writefile("sixsense/${cacheKey}.lua", _DECODER)
    return loadstring(_DECODER)()({_DATA})
end`;
}

// Main encryption function - NEW APPROACH with byte arrays
export function encryptScript(
  script: string,
  accessKey: string,
  requireKey: boolean,
  baseUrl: string
): { loader: string; decoder: string } {
  // Generate unique encryption key
  const encryptionKey = generateEncryptionKey(accessKey);
  
  // Encrypt script content with XOR - returns byte array
  const encrypted = xorEncrypt(script, encryptionKey);
  const encryptedArray = toLuaArray(encrypted);
  
  // Generate decoder
  const decoder = generateLuaDecoder('', encryptionKey, accessKey);
  
  // Generate loader
  const loader = generateEncryptedLoader(encryptedArray, accessKey, baseUrl, requireKey);
  
  return { loader, decoder };
}
