#!/bin/bash

clear
echo "================================================================"
echo "          Mommy AI - Development Environment"
echo "================================================================"
echo
echo "Choose your setup mode:"
echo
echo "1. First Time Install + Setup"
echo "   - Install Ollama (if needed)"
echo "   - Download AI models (Llama 3.2)"
echo "   - Install all dependencies"
echo "   - Configure network settings"
echo "   - Start complete environment"
echo
echo "2. Daily Development"
echo "   - Quick dependency check"
echo "   - Update IP configuration"
echo "   - Start AI server + Expo"
echo "   - Ready to code!"
echo
read -p "Enter choice (1 or 2): " mode

if [ "$mode" = "1" ]; then
  first_time_setup=true
elif [ "$mode" = "2" ]; then
  first_time_setup=false
else
  echo "Invalid choice. Using Daily Development"
  first_time_setup=false
fi

# ------------------------
# Get Local IP Address
# ------------------------
get_ip() {
  ip=$(ipconfig getifaddr en0 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
}

# ------------------------
# FIRST TIME INSTALL
# ------------------------
if [ "$first_time_setup" = true ]; then
  clear
  echo "================================================================"
  echo "        stuHACK - First Time Install + Setup"
  echo "================================================================"
  echo
  echo "This will set up everything you need:"
  echo "- Check/Install Ollama"
  echo "- Download Llama 3.2 AI model"
  echo "- Install React Native dependencies"
  echo "- Install notification system"
  echo "- Configure network settings"
  echo "- Start development environment"
  echo
  read -p "Press Enter to continue..."

  echo "[1/7] Checking Ollama installation..."
  if ! command -v ollama &> /dev/null; then
    echo "Ollama not found!"
    echo "Please install Ollama from https://ollama.ai"
    open https://ollama.ai
    echo "After installation, re-run this script."
    exit 1
  else
    echo "Ollama is installed."
  fi

  echo
  echo "[2/7] Installing npm dependencies..."
  if [ ! -d node_modules ]; then
    npm install || { echo "Failed to install npm packages. Ensure Node.js is installed."; exit 1; }
  else
    echo "Dependencies already installed."
  fi

  echo
  echo "[3/7] Setting up notification system..."
  if ! grep -q "expo-notifications" package.json; then
    npx expo install expo-notifications expo-device expo-constants || echo "Notification setup failed, skipping..."
  else
    echo "Notification system already configured."
  fi

  echo
  echo "[4/7] Configuring network..."
  get_ip
  echo "Your network IP: $ip"
  echo "Updating AI service config..."
  sed -E -i '' "s|http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:11434/api/generate|http://$ip:11434/api/generate|g" app/utils/ultraSimpleAI.ts
  echo "AI service configured."

  echo
  echo "[5/7] Downloading Llama 3.2 model..."
  if ! ollama list | grep -q llama3.2; then
    ollama pull llama3.2 || (echo "Falling back to llama3..." && ollama pull llama3) || { echo "Failed to pull model."; exit 1; }
  else
    echo "Model already available."
  fi

  echo
  echo "[6/7] Testing AI service..."
  OLLAMA_HOST=0.0.0.0 ollama serve &
  sleep 5
  if ! ollama list &> /dev/null; then
    echo "AI test inconclusive - continuing..."
  else
    echo "AI service OK."
  fi

  echo
  echo "[7/7] Starting dev environment..."
  OLLAMA_HOST=0.0.0.0 ollama serve &
  sleep 3
  echo
  echo "================================================================"
  echo "           FIRST TIME SETUP COMPLETE!"
  echo "================================================================"
  echo
  echo "stuHACK is ready with:"
  echo "- Llama 3.2 AI Chatbot"
  echo "- Push notifications"
  echo "- Personality & task system"
  echo
  echo "AI Server: http://$ip:11434"
  echo
  echo "Starting Expo server..."
  npx expo start

# ------------------------
# DAILY DEVELOPMENT
# ------------------------
else
  clear
  echo "================================================================"
  echo "         stuHACK - Daily Development"
  echo "================================================================"
  echo

  echo "[1/4] Checking npm dependencies..."
  if [ ! -d node_modules ]; then
    npm install || { echo "Failed to install npm packages."; exit 1; }
  else
    echo "Dependencies ready."
  fi

  echo
  echo "[2/4] Checking Ollama..."
  if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Run First Time Setup."
    exit 1
  fi

  echo
  echo "[3/4] Updating network config..."
  get_ip
  echo "Current IP: $ip"
  sed -E -i '' "s|http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:11434/api/generate|http://$ip:11434/api/generate|g" app/utils/ultraSimpleAI.ts
  echo "AI config updated."

  echo
  echo "[4/4] Starting services..."
  OLLAMA_HOST=0.0.0.0 ollama serve &
  sleep 3
  echo "AI server running in background"
  echo

  echo "================================================================"
  echo "       DAILY DEVELOPMENT READY"
  echo "================================================================"
  echo
  echo "AI Server: http://$ip:11434"
  echo
  npx expo start
fi

echo
echo "Thanks for using stuHACK tools!"