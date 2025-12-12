#!/usr/bin/env node

/**
 * Test Work.ink Debug Endpoint
 */

const BASE_URL = 'http://localhost:3000';

async function testDebug() {
  console.log('🔍 Testing Work.ink Debug Endpoint...\n');

  try {
    // First create a session
    console.log('1️⃣ Creating test session...');
    const startRes = await fetch(`${BASE_URL}/api/workink/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discord_id: 'debug_test',
        workink_link_slug: 'sixsense'
      })
    });

    const startData = await startRes.json();
    if (!startData.success) {
      console.error('❌ Failed to create session');
      return;
    }

    const sessionId = startData.session_id;
    console.log(`✅ Session created: ${sessionId}\n`);

    // Now debug it
    console.log('2️⃣ Fetching debug info...');
    const debugRes = await fetch(`${BASE_URL}/api/workink/debug?session_id=${sessionId}`);
    const debugData = await debugRes.json();
    
    console.log('Debug Response:');
    console.log(JSON.stringify(debugData, null, 2));

    console.log('\n📊 Summary:');
    console.log(`Session exists: ${debugData.diagnostics.session_exists}`);
    console.log(`Session expired: ${debugData.diagnostics.session_expired}`);
    console.log(`Status: ${debugData.diagnostics.status}`);
    console.log(`Has key: ${debugData.diagnostics.key_found}`);
    console.log(`Time remaining: ${debugData.session.time_remaining} seconds`);

    // Test with invalid session
    console.log('\n3️⃣ Testing with invalid session...');
    const invalidRes = await fetch(`${BASE_URL}/api/workink/debug?session_id=invalid_session_id`);
    const invalidData = await invalidRes.json();
    console.log('Invalid session response:');
    console.log(JSON.stringify(invalidData.diagnostics, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDebug();
