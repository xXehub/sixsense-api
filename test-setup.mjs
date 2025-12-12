#!/usr/bin/env node

/**
 * Quick Test: Check if ngrok and dev server are ready
 */

const BASE_URL = 'http://localhost:3000';
const NGROK_URL = 'https://7b825fa26fd3.ngrok-free.app';

async function quickTest() {
  console.log('\n🧪 Testing Work.ink Setup...\n');

  try {
    // Test 1: Check localhost
    console.log('1️⃣ Testing localhost dev server...');
    const localRes = await fetch(`${BASE_URL}/api/workink/check-session?session_id=test`);
    if (localRes.status === 404) {
      console.log('✅ Localhost dev server is running!\n');
    } else {
      console.log('⚠️  Localhost responded but might have issue\n');
    }

    // Test 2: Check ngrok
    console.log('2️⃣ Testing ngrok tunnel...');
    const ngrokRes = await fetch(`${NGROK_URL}/api/workink/check-session?session_id=test`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (ngrokRes.status === 404) {
      console.log('✅ Ngrok tunnel is working!\n');
    } else {
      console.log('⚠️  Ngrok responded but might have issue\n');
    }

    console.log('✅ Setup looks good!\n');
    console.log('📋 Next Steps:');
    console.log('1. Go to: http://localhost:3000/get-key/workink');
    console.log('2. Click "START" button');
    console.log('3. Complete offer on Work.ink');
    console.log('4. Watch for automatic detection!');
    console.log('\n🔍 Monitor:');
    console.log('- Terminal logs for callback');
    console.log('- Ngrok dashboard: http://localhost:4040');
    console.log('\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure dev server is running: npm run dev');
    console.log('- Make sure ngrok is running: ngrok http 3000');
    console.log('\n');
  }
}

quickTest();
