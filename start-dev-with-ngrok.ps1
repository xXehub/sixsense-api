# Work.ink Development Setup with Ngrok
# Run this script to start both Next.js dev server and ngrok

Write-Host "`n🚀 Work.ink Development Setup`n" -ForegroundColor Cyan

# Check if ngrok is installed
$ngrokExists = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokExists) {
    Write-Host "❌ Ngrok not found!" -ForegroundColor Red
    Write-Host "`n💡 Install ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://ngrok.com/download"
    Write-Host "   2. Extract to a folder"
    Write-Host "   3. Add to PATH or run from that folder"
    Write-Host "   4. Or install via: choco install ngrok (if you have Chocolatey)`n"
    exit 1
}

Write-Host "✅ Ngrok found!" -ForegroundColor Green

# Start Next.js dev server in background
Write-Host "`n📦 Starting Next.js dev server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# Wait for dev server to start
Write-Host "⏳ Waiting for dev server to start (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start ngrok
Write-Host "`n🌐 Starting ngrok tunnel..." -ForegroundColor Yellow
Write-Host "   This will create a public URL for your localhost:3000`n" -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 3000"

# Wait for ngrok to start
Start-Sleep -Seconds 3

Write-Host "`n✅ Setup Complete!`n" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check the ngrok window for your HTTPS URL" -ForegroundColor White
Write-Host "   2. Copy the URL (e.g., https://abc123.ngrok-free.app)" -ForegroundColor White
Write-Host "   3. Go to: https://dashboard.work.ink" -ForegroundColor White
Write-Host "   4. Navigate to: For Developers → Key System → Your Link" -ForegroundColor White
Write-Host "   5. Set Destination Link to:" -ForegroundColor White
Write-Host "      https://YOUR-NGROK-URL.ngrok-free.app/api/workink/callback`n" -ForegroundColor Yellow

Write-Host "🌐 Useful Links:" -ForegroundColor Cyan
Write-Host "   - Local site: http://localhost:3000" -ForegroundColor White
Write-Host "   - Ngrok dashboard: http://localhost:4040" -ForegroundColor White
Write-Host "   - Work.ink dashboard: https://dashboard.work.ink`n" -ForegroundColor White

Write-Host "⚠️  Keep both windows open while testing!`n" -ForegroundColor Yellow
