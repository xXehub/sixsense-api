#!/usr/bin/env node

/**
 * Debug: Check if session is stored properly in the flow
 */

console.log('\n🔍 Debugging Work.ink Flow...\n');

console.log('📋 Expected Flow:');
console.log('1. User clicks START');
console.log('   → Session created and stored in sessionStorage');
console.log('   → Work.ink opens in new tab\n');

console.log('2. User completes offer on Work.ink');
console.log('   → Work.ink redirects to callback URL\n');

console.log('3. Callback detects user from Work.ink');
console.log('   → Redirects to: /get-key/workink?completed=true&from=workink\n');

console.log('4. Frontend checks:');
console.log('   - completedParam = "true" ✓');
console.log('   - fromWorkink = "workink" ✓');
console.log('   - existingSession = sessionStorage.getItem("workink_session_id")');
console.log('   → If exists: Show waiting state with "I\'ve Completed" button');
console.log('   → If null: Show error "Session expired"\n');

console.log('5. User clicks "I\'ve Completed the Offer"');
console.log('   → Call /api/workink/verify-completion');
console.log('   → Generate key if verified\n');

console.log('❓ Troubleshooting Steps:\n');

console.log('1. Open browser console (F12) and run:');
console.log('   console.log(sessionStorage.getItem("workink_session_id"));\n');

console.log('2. If it shows "null":');
console.log('   → Session was cleared or never set');
console.log('   → Click START button to create new session');
console.log('   → Check again: sessionStorage should have the session ID\n');

console.log('3. If session exists but page shows START:');
console.log('   → Check browser console for debug logs');
console.log('   → Look for: "🔍 Initialize debug:"');
console.log('   → Verify URL has: ?completed=true&from=workink\n');

console.log('4. Complete test flow:');
console.log('   a. Go to: http://localhost:3000/get-key/workink');
console.log('   b. Open console (F12)');
console.log('   c. Click START');
console.log('   d. Check console for session ID');
console.log('   e. Complete offer');
console.log('   f. After redirect, check console for debug logs');
console.log('   g. Should see "✅ User returned from Work.ink"\n');

console.log('💡 Quick Fix:');
console.log('If page keeps showing START screen:');
console.log('1. Open console: sessionStorage.setItem("workink_session_id", "test123")');
console.log('2. Go to: http://localhost:3000/get-key/workink?completed=true&from=workink');
console.log('3. Should now show waiting state with button\n');
