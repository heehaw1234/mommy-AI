@echo off
cls
echo ================================================================
echo           stuHACK - Development Environment
echo ================================================================
echo.
echo Choose your setup mode:
echo.
echo 1. First Time Install + Setup
echo    - Install Ollama (if needed)
echo    - Download AI models
echo    - Install all dependencies
echo    - Configure network settings
echo    - Start complete environment
echo.
echo 2. Daily Development
echo    - Quick dependency check
echo    - Update IP configuration
echo    - Start AI server + Expo
echo    - Ready to code!
echo.
set /p mode="Enter choice (1 or 2): "

if "%mode%"=="1" goto :first_time_setup
if "%mode%"=="2" goto :daily_development

echo Invalid choice. Using Daily Development
goto :daily_development

:: =============================================================================
:: FIRST TIME INSTALL + SETUP
:: =============================================================================
:first_time_setup
cls
echo ================================================================
echo         stuHACK - First Time Install + Setup
echo ================================================================
echo.
echo This will set up everything you need for stuHACK development:
echo - Check/Install Ollama AI platform
echo - Download Llama 3.2 AI model
echo - Install React Native dependencies  
echo - Install notification system
echo - Configure network settings
echo - Start development environment
echo.
pause

:: Check Ollama installation
echo [1/7] Checking Ollama installation
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama not found!
    echo.
    echo REQUIRED: Please install Ollama first
    echo 1. Go to: https://ollama.ai
    echo 2. Download and install Ollama for Windows
    echo 3. Restart this script after installation
    echo.
    echo Press any key to open Ollama website
    pause >nul
    start https://ollama.ai
    echo.
    echo After installing Ollama, run this script again.
    pause
    exit /b 1
) else (
    echo Ollama is installed and ready
)

:: Install Node.js dependencies
echo.
echo [2/7] Installing project dependencies
if not exist "node_modules" (
    echo Installing npm packages (this may take a few minutes)
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies
        echo Make sure you have Node.js installed from https://nodejs.org
        pause
        exit /b 1
    )
    echo Project dependencies installed
) else (
    echo Dependencies already installed
)

:: Install notification system
echo.
echo [3/7] Setting up notification system...
findstr "expo-notifications" package.json >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing push notification packages...
    call npx expo install expo-notifications expo-device expo-constants
    if %errorlevel% neq 0 (
        echo Notification install failed - app will work but no push notifications
    ) else (
        echo Notification system ready for Android/iOS
    )
) else (
    echo Notification system already configured
)

:: Get network IP and configure
echo.
echo [4/7] Configuring network settings...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set "ip=%%a"
    goto :found_ip_first_time
)
:found_ip_first_time
set ip=%ip: =%
echo Your network IP: %ip%

:: Update AI service with network IP
echo Configuring AI service for network access...
powershell -Command "$content = Get-Content 'app\utils\ultraSimpleAI.ts' -Encoding UTF8; $content -replace 'http://\d+\.\d+\.\d+\.\d+:11434/api/generate', 'http://%ip%:11434/api/generate' | Set-Content 'app\utils\ultraSimpleAI.ts' -Encoding UTF8"
echo AI service configured for your network

:: Download AI models
echo.
echo [5/7] Setting up AI models...
ollama list | findstr "llama3.2" >nul 2>&1
if %errorlevel% neq 0 (
    echo Downloading Llama 3.2 AI model...
    echo This may take 5-15 minutes depending on your internet speed
    echo.
    ollama pull llama3.2
    if %errorlevel% neq 0 (
        echo Llama 3.2 not available, trying Llama 3...
        ollama pull llama3
        if %errorlevel% neq 0 (
            echo Failed to download AI model
            echo Check your internet connection and try again
            pause
            exit /b 1
        ) else (
            echo Llama 3 model downloaded successfully
        )
    ) else (
        echo Llama 3.2 model downloaded successfully  
    )
) else (
    echo AI model already available
)

:: Test AI service
echo.
echo [6/7] Testing AI configuration...
start "Ollama Test" cmd /c "set OLLAMA_HOST=0.0.0.0 && ollama serve" 
timeout /t 5 /nobreak >nul
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo AI service test inconclusive - continuing anyway
) else (
    echo AI service working correctly
)

:: Start development environment  
echo.
echo [7/7] Starting development environment...
start "stuHACK AI Server" cmd /k "echo stuHACK AI Server && echo Starting Ollama at http://%ip%:11434 && echo. && set OLLAMA_HOST=0.0.0.0 && ollama serve"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo                 FIRST TIME SETUP COMPLETE!
echo ================================================================
echo.
echo Your stuHACK development environment is ready!
echo.
echo Features Installed:
echo   - AI Chatbot with Llama 3.2 model
echo   - Push notifications for Android/iOS  
echo   - 5-level personality system (mommy levels)
echo   - Complete task management with AI
echo   - Smart reminders based on your fierceness level
echo.
echo Network Configuration:
echo   - AI Server: http://%ip%:11434
echo   - Mobile app can connect from any device on your network
echo.
echo Starting Expo development server...
echo ================================================================

call npx expo start
goto :end
:: =============================================================================
:: DAILY DEVELOPMENT MODE
:: =============================================================================
:daily_development
cls
echo ================================================================
echo           stuHACK - Daily Development Startup
echo ================================================================
echo.

:: Quick dependency check
echo [1/4] Quick system check...
if not exist "node_modules" (
    echo Installing missing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies
        echo Try running "First Time Install + Setup" instead
        pause
        exit /b 1
    )
) else (
    echo Dependencies ready
)

:: Check Ollama
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama not found!
    echo Please run "First Time Install + Setup" first
    pause
    exit /b 1
) else (
    echo Ollama ready
)

:: Update IP configuration  
echo.
echo [2/4] Updating network configuration...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set "ip=%%a"
    goto :found_ip_daily
)
:found_ip_daily
set ip=%ip: =%
echo Current IP: %ip%

:: Update AI service with current IP
powershell -Command "$content = Get-Content 'app\utils\ultraSimpleAI.ts' -Encoding UTF8; $content -replace 'http://\d+\.\d+\.\d+\.\d+:11434/api/generate', 'http://%ip%:11434/api/generate' | Set-Content 'app\utils\ultraSimpleAI.ts' -Encoding UTF8" >nul 2>&1
echo AI service updated

:: Start AI server
echo.
echo [3/4] Starting AI services...
start "stuHACK AI Server" cmd /k "echo stuHACK AI Server && echo Ready at: http://%ip%:11434 && echo Press Ctrl+C to stop && echo. && set OLLAMA_HOST=0.0.0.0 && ollama serve"
timeout /t 3 /nobreak >nul
echo AI server started in background

:: Start development server
echo.
echo [4/4] Starting development server...
echo.
echo ================================================================
echo                    DAILY DEVELOPMENT READY!
echo ================================================================
echo.
echo AI Features Ready:
echo   - Chatbot with personality levels 1-5
echo   - Task management with natural language
echo   - Smart notifications based on fierceness level
echo.
echo Network Status:
echo   - AI Server: http://%ip%:11434
echo   - Expo Dev Server: Starting now...
echo.
echo Quick Tips:
echo   - Test AI in the chatbot tab
echo   - Set your mommy level in profile
echo   - Create tasks to test notifications
echo.
echo ================================================================

call npx expo start
goto :end

:: =============================================================================
:: END
:: =============================================================================
:end
echo.
echo Thank you for using stuHACK development tools!
echo.
echo Need help?
echo - First time issues: Run option 1 again
echo - Daily development: Use option 2
echo - Check GitHub repo for documentation
echo.
pause
