# stuHACK - AI-Powered Task Management App 🚀

A React Native app built with Expo, featuring an intelligent AI chatbot powered by local Ollama integration, Supabase backend, and comprehensive task management.

## 🎯 Features

- **AI Chatbot** - Local Ollama integration with Llama 3.2 for unlimited, free AI responses
- **Task Management** - Create, edit, and organize tasks with calendar integration
- **Multi-Provider AI** - Ollama (primary), OpenAI, Hugging Face with smart fallbacks
- **Supabase Backend** - Real-time data synchronization and authentication
- **Cross-Platform** - Works on iOS, Android, and web

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
Create a `.env` file in the project root:
```properties
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
HUGGING_FACE_TOKEN=your_hugging_face_token
OPENAI_API_KEY=your_openai_api_key
```

### 3. Unified Setup & Development Script

All setup and development is now handled by **one batch file**:

```bash
dev-start.bat
```

When you run it, you'll see two options:

#### **Option 1: First Time Install + Setup**
- Installs all dependencies (Node.js, Expo, notification system)
- Checks Ollama installation (guides you to install if missing)
- Downloads Llama 3.2 AI model (or Llama 3 fallback)
- Configures your network IP automatically
- Starts Ollama AI server and Expo development server
- **Use this the first time you set up the project, or if you need to reset everything.**

#### **Option 2: Daily Development**
- Checks dependencies
- Updates your network IP in the AI service
- Starts Ollama AI server in the background
- Starts Expo development server
- **Use this every day for fast startup!**

**No more separate setup scripts needed!**

---

## 🤖 AI Chatbot Setup

### ⚡ Automated Setup (Recommended)

**Prerequisites:**
1. Install [Node.js](https://nodejs.org) 
2. Install [Ollama](https://ollama.ai) 

**First Time:**
```bash
dev-start.bat
# Choose option 1: First Time Install + Setup
```

**Daily Development:**
```bash
dev-start.bat
# Choose option 2: Daily Development
```

**Everything else is handled for you!**

---

## 🏗️ Development

### Project Structure
```
app/
├── (tabs)/           # Tab navigation screens
│   ├── home.tsx      # Home screen
│   ├── second.tsx    # Calendar view
│   ├── third.tsx     # Task management
│   ├── fourth.tsx    # Settings
│   └── chatbot.tsx   # AI chatbot interface
├── utils/            # Utility functions
│   ├── ultraSimpleAI.ts    # AI service integration
│   ├── taskUtils.ts        # Task management helpers
│   └── supabaseTaskService.ts # Database operations
└── components/       # Reusable components
```

### Key Technologies
- **Expo** ~53.0.20 - React Native framework
- **TypeScript** - Type safety
- **Supabase** - Backend as a Service
- **Ollama** - Local AI inference
- **expo-router** - File-based navigation

## 🔧 Troubleshooting

### AI Chatbot Issues

**"Network request failed":**
- Ensure Ollama is running: `ollama serve`
- Check if using correct IP in ultraSimpleAI.ts
- Try restarting Ollama with network access: `$env:OLLAMA_HOST="0.0.0.0"; ollama serve`

**No AI responses:**
- Check console logs for detailed error messages
- Verify API keys in `.env` file
- System automatically falls back to smart responses if all APIs fail

### General Issues

**Metro bundler errors:**
```bash
npx expo start --clear
```

**Dependencies issues:**
```bash
npm install --legacy-peer-deps
```

## 🎯 Hackathon Quick Setup

**🚀 Super Quick (Windows - Zero Manual Commands):**
1. Install [Node.js](https://nodejs.org) and [Ollama](https://ollama.ai)
2. Clone repo: `git clone <your-repo>`
3. Run `dev-start.bat` and choose option 1
4. For daily use, run `dev-start.bat` and choose option 2
5. **✅ AI Chatbot ready - start demo!** 🎉

> **For teammates:** Just install Node.js + Ollama, then copy the entire project folder. The batch file handles everything else automatically including model downloads!

**Manual (Any Platform):**
1. Clone repo
2. `npm install`
3. Set up `.env` with your API keys (optional)
4. Install Ollama: `ollama pull llama3.2`
5. Start Ollama: `$env:OLLAMA_HOST="0.0.0.0"; ollama serve`
6. Start app: `npx expo start`
7. **✅ Test AI chatbot - you're ready to demo!** 🚀

## 📱 Platform Support

- **Web** - Works with localhost endpoints
- **Android Emulator** - Uses 10.0.2.2 endpoint
- **Physical Device** - Uses your local IP address
- **iOS Simulator** - Works with localhost endpoints

## 🤝 Contributing

Built for SMU Hackathon - feel free to extend and improve!

## 📄 License

Open source - perfect for hackathon projects and learning!
