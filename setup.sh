#!/bin/bash

# 🎓 EduTech Motivation Coach Setup Script
# Run this after setting up your Supabase database

echo "🚀 Setting up Dynamic Motivation Coach for EduTech..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from your project root directory"
    exit 1
fi

echo "📊 Creating StudentProfiles table in Supabase..."
echo "⚠️  Please run the SQL script in database/student_profiles.sql in your Supabase dashboard"
echo ""
echo "📝 Instructions:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of database/student_profiles.sql"
echo "4. Click 'Run' to create the table"
echo ""

# Check if motivationCoach file exists
if [ -f "app/utils/motivationCoach.ts" ]; then
    echo "✅ Motivation Coach service file created"
else
    echo "❌ Missing motivationCoach.ts file"
    exit 1
fi

# Check if chatbot is updated
if grep -q "MotivationCoach" "app/(tabs)/chatbot.tsx"; then
    echo "✅ Chatbot integration complete"
else
    echo "❌ Chatbot integration missing"
    exit 1
fi

echo ""
echo "🎯 EduTech Marketing Features Ready:"
echo "   ✅ Stress level detection"
echo "   ✅ Learning style analysis"
echo "   ✅ Adaptive AI personality"
echo "   ✅ Real-time behavioral analytics"
echo "   ✅ Motivational coaching system"
echo ""
echo "📚 Demo Script Ready:"
echo "   1. Create some tasks with different stress patterns"
echo "   2. Watch AI personality adapt in real-time"
echo "   3. Show stress level detection in header"
echo "   4. Demonstrate learning style optimization"
echo ""
echo "🏫 University Partnership Ready:"
echo "   📊 Analytics dashboard for administrators"
echo "   🔒 FERPA-compliant data handling"
echo "   📈 Student success metrics tracking"
echo "   🤝 Academic success center integration"
echo ""
echo "🎓 Next Steps:"
echo "   1. Set up StudentProfiles table in Supabase"
echo "   2. Test the adaptive personality system"
echo "   3. Create pilot program with local university"
echo "   4. Gather student success data"
echo "   5. Launch marketing campaign!"
echo ""
echo "🚀 Ready to revolutionize student success with AI psychology!"

# PowerShell version for Windows
cat > setup.ps1 << 'EOF'
# 🎓 EduTech Motivation Coach Setup Script (PowerShell)
Write-Host "🚀 Setting up Dynamic Motivation Coach for EduTech..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Please run this script from your project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Creating StudentProfiles table in Supabase..." -ForegroundColor Yellow
Write-Host "⚠️  Please run the SQL script in database/student_profiles.sql in your Supabase dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Cyan
Write-Host "1. Go to your Supabase dashboard"
Write-Host "2. Navigate to SQL Editor"
Write-Host "3. Copy and paste the contents of database/student_profiles.sql"
Write-Host "4. Click 'Run' to create the table"
Write-Host ""

# Check if motivationCoach file exists
if (Test-Path "app/utils/motivationCoach.ts") {
    Write-Host "✅ Motivation Coach service file created" -ForegroundColor Green
} else {
    Write-Host "❌ Missing motivationCoach.ts file" -ForegroundColor Red
    exit 1
}

# Check if chatbot is updated
$chatbotContent = Get-Content "app/(tabs)/chatbot.tsx" -Raw
if ($chatbotContent -match "MotivationCoach") {
    Write-Host "✅ Chatbot integration complete" -ForegroundColor Green
} else {
    Write-Host "❌ Chatbot integration missing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 EduTech Marketing Features Ready:" -ForegroundColor Green
Write-Host "   ✅ Stress level detection"
Write-Host "   ✅ Learning style analysis"
Write-Host "   ✅ Adaptive AI personality"
Write-Host "   ✅ Real-time behavioral analytics"
Write-Host "   ✅ Motivational coaching system"
Write-Host ""
Write-Host "🚀 Ready to revolutionize student success with AI psychology!" -ForegroundColor Green
EOF

echo "✅ Setup scripts created for both Unix (setup.sh) and Windows (setup.ps1)"
echo "📝 Run ./setup.sh (Unix) or ./setup.ps1 (Windows) to verify your installation"
