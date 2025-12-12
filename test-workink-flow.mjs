#!/usr/bin/env node

/**
 * Test Work.ink Flow
 * 
 * This script tests the complete Work.ink flow:
 * 1. Create session via /api/workink/start-session
 * 2. Simulate callback from Work.ink
 * 3. Check session status via /api/workink/check-session
 */

const BASE_URL = 'http://localhost:3000';

async function testFlow() {
  console.log('🚀 Testing Work.ink Flow...\n');

  try {
    // Step 1: Create session
    console.log('📝 Step 1: Creating session...');
    const startRes = await fetch(`${BASE_URL}/api/workink/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discord_id: 'test_user_123',
        workink_link_slug: 'sixsense'
      })
    });

    const startData = await startRes.json();
    console.log('Response:', JSON.stringify(startData, null, 2));

    if (!startData.success) {
      console.error('❌ Failed to create session');
      return;
    }

    const sessionId = startData.session_id;
    console.log(`✅ Session created: ${sessionId}\n`);

    // Step 2: Check session (should be pending)
    console.log('📝 Step 2: Checking session (should be pending)...');
    const checkRes1 = await fetch(`${BASE_URL}/api/workink/check-session?session_id=${sessionId}`);
    const checkData1 = await checkRes1.json();
    console.log('Response:', JSON.stringify(checkData1, null, 2));
    console.log(`Status: ${checkRes1.status}\n`);

    // Step 3: Simulate callback (you need to replace TOKEN with real one from Work.ink)
    console.log('📝 Step 3: Testing callback URL format...');
    console.log(`Callback URL would be: ${BASE_URL}/api/workink/callback?sr=${sessionId}&token=YOUR_TOKEN`);
    console.log('⚠️  To test callback, you need to:');
    console.log('   1. Set callback URL in Work.ink Dashboard');
    console.log('   2. Complete an actual offer');
    console.log('   3. Work.ink will call the callback\n');

    // Step 4: Test with invalid session
    console.log('📝 Step 4: Testing with invalid session...');
    const checkRes2 = await fetch(`${BASE_URL}/api/workink/check-session?session_id=invalid_session_id`);
    const checkData2 = await checkRes2.json();
    console.log('Response:', JSON.stringify(checkData2, null, 2));
    console.log(`Status: ${checkRes2.status}\n`);

    console.log('✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log(`- Session ID: ${sessionId}`);
    console.log(`- Work.ink URL: ${startData.workink_url}`);
    console.log(`- Expires at: ${startData.expires_at}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testFlow();
