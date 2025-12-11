import CryptoJS from 'crypto-js';

// Copy of generateLuaDecoder function
function generateLuaDecoder(encryptedData, encryptionKey, accessKey) {
  const halfKey = encryptionKey.substring(0, Math.floor(encryptionKey.length / 2));
  const keyBytes = Array.from(Buffer.from(halfKey, 'utf8'));
  const keyArray = `{${keyBytes.join(',')}}`;
  const checksum = CryptoJS.MD5(encryptionKey).toString().substring(0, 8);
  
  return `return function(data)
-- ENVIRONMENT CHECKS (Anti-Debug, Anti-VM)
if not game then return warn("Invalid environment") end
if not bit32 or not bit32.bxor then return warn("Missing bit32") end
if not loadstring then return warn("Missing loadstring") end
if getgenv and getgenv()._DEBUG then return warn("Debug detected") end

-- ANTI-TAMPER: Check if already executed (flag will be set AFTER successful execution)
local tamperFlag = "_SIXSENSE_${accessKey.substring(0, 8)}"
if getgenv and getgenv()[tamperFlag] then 
    return warn("Tamper detected - script already executed") 
end

-- INTEGRITY CHECK (Optional - can fail gracefully)
local expectedChecksum = "${checksum}"
pcall(function()
    local success, actualChecksum = pcall(function()
        return game:GetService("HttpService"):GetAsync("${process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev'}/api/decoder/verify/${accessKey}")
    end)
    if success and type(actualChecksum) == "string" and actualChecksum ~= expectedChecksum then
        warn("[SixSense] Integrity check failed - decoder may be tampered")
    end
end)

-- DYNAMIC KEY: Get second half from data
local encrypted = data[1]
local dynamicKeyBytes = data[2] or {}
local staticKey = ${keyArray}

-- Combine static + dynamic keys
local fullKey = {}
for i = 1, #staticKey do
    table.insert(fullKey, staticKey[i])
end
for i = 1, #dynamicKeyBytes do
    table.insert(fullKey, dynamicKeyBytes[i])
end

-- XOR DECRYPT
local result = {}
local keyLen = #fullKey
if keyLen == 0 then return warn("Invalid key") end

for i = 1, #encrypted do
    local encByte = encrypted[i]
    local keyByte = fullKey[((i - 1) % keyLen) + 1]
    table.insert(result, string.char(bit32.bxor(encByte, keyByte)))
end

-- EXECUTE
local decrypted = table.concat(result)
local func, err = loadstring(decrypted)
if func then
    -- Set tamper flag BEFORE execution (prevent double execution during same session)
    if getgenv then getgenv()[tamperFlag] = true end
    
    local success, result = pcall(func)
    
    if success then
        -- Success: Keep flag set (prevent re-execution)
        return result
    else
        -- Error: Clear flag to allow retry
        if getgenv then getgenv()[tamperFlag] = nil end
        return warn("[SixSense] Script error: " .. tostring(result))
    end
else
    -- Decode error: Don't set flag, allow retry
    return warn("[SixSense] Decode error: " .. tostring(err))
end
end`;
}

// Test
const decoder = generateLuaDecoder('', 'testkey123testkey123testkey123test', 'testaccess');
console.log('=== FULL DECODER ===');
console.log(decoder);
console.log('\n=== LAST 200 CHARS ===');
console.log(decoder.substring(decoder.length - 200));
