#!/usr/bin/env node

/**
 * Ngrok Helper Script
 * 
 * This script starts ngrok and shows the URL to use in Work.ink Dashboard
 */

const { spawn } = require('child_process');

console.log('\n🚀 Starting Ngrok for Work.ink Development...\n');

// Start ngrok
const ngrok = spawn('ngrok', ['http', '3000'], {
  stdio: 'inherit',
  shell: true
});

ngrok.on('error', (error) => {
  console.error('\n❌ Error starting ngrok:', error.message);
  console.log('\n💡 Make sure ngrok is installed:');
  console.log('   Download from: https://ngrok.com/download');
  console.log('   Or run: choco install ngrok (Windows with Chocolatey)');
  process.exit(1);
});

ngrok.on('close', (code) => {
  console.log(`\n⚠️  Ngrok stopped with code ${code}`);
  process.exit(code);
});

// Wait a bit then show instructions
setTimeout(() => {
  console.log('\n📋 Next Steps:');
  console.log('1. Check ngrok output above for your HTTPS URL');
  console.log('2. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)');
  console.log('3. Go to: https://dashboard.work.ink');
  console.log('4. Navigate to: For Developers → Key System → Your Link');
  console.log('5. Set Destination Link to:');
  console.log('   https://YOUR-NGROK-URL.ngrok-free.app/api/workink/callback');
  console.log('\n🌐 Ngrok Web Interface: http://localhost:4040');
  console.log('   Use this to debug incoming requests\n');
}, 3000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Stopping ngrok...');
  ngrok.kill();
  process.exit(0);
});
