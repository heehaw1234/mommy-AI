# Mommy AI - Advanced Task Management & AI Assistant 🚀💝

A sophisticated React Native app built with Expo, featuring an intelligent AI chatbot with dynamic personality system, comprehensive task management, advanced mommy-level behavior adaptation, and a global floating AI overlay.

## ✨ Key Features

### 🤖 **Advanced AI System**
- **Mommy Personality System** - 10-level personality scale (Sweet → Alpha) with dynamic behavior
- **Contextual AI Responses** - Smart responses based on task status, deadlines, and completion rates
- **Multi-Provider AI** - Ollama (primary), OpenAI, Hugging Face with intelligent fallbacks
- **Dynamic Speech Patterns** - Personality-based communication styles and vocabulary
- **Voice Integration** - Speech-to-text and text-to-speech functionality

### 📋 **Intelligent Task Management**
- **Mommy Multiplier System** - Task urgency dynamically adjusts based on personality level (1x → 5x strictness)
- **Smart Task Prioritization** - Overdue → Critical → Urgent → Upcoming with visual indicators
- **Advanced Task Filtering** - All/Active/Completed tasks with intelligent sorting by deadline proximity
- **Real-time Synchronization** - Instant updates across all pages and devices
- **Rich Task Details** - Date, time, descriptions, completion tracking, and priority indicators
- **Calendar Integration** - Full calendar view with task visualization and date selection

### 🎨 **Modern UI/UX Design**
- **Standardized Headers** - Consistent design across all pages with personality indicators
- **Responsive Design** - Optimized for mobile with smooth animations and transitions
- **Global State Management** - Context-based architecture for seamless data flow
- **Cross-Platform Support** - iOS, Android, and web compatibility
- **Adaptive Themes** - Personality-based color schemes and visual feedback

### 🏗️ **Architecture & Development**
- **TypeScript** - Full type safety throughout the application
- **Modular Architecture** - Clean separation of concerns with reusable components
- **Context-Driven State** - React Context for global state management
- **Persistent Storage** - Supabase backend with offline-capable local storage
- **Error Handling** - Comprehensive error management and graceful fallbacks
- **Component Library** - Reusable UI components (StandardHeader, AppButton, FormInput, etc.)

### 🛠️ **Technical Highlights**
- **Database Integration** - Supabase for user authentication and task storage
- **Animation System** - Smooth React Native animations with gesture handling
- **Navigation System** - Expo Router with proper tab-based routing
- **Calendar System** - Advanced calendar with task markers and date navigation
- **ICS Import** - Calendar file import functionality for external events

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

```

**Linux/macOS:**
```bash
# Quick development start
./dev-start.sh

# Or manually:
npx expo start
```

### 4. Setup Instructions for `dev-start.bat` and `dev-start.sh`

These scripts provide automated development environment setup:

**dev-start.bat (Windows):**
- Automatically installs dependencies if node_modules is missing
- Clears Expo cache and metro bundler cache
- Starts Expo development server with optimized settings
- Provides colored output for better debugging

**dev-start.sh (Linux/macOS):**
- Same functionality as Windows batch file
- Includes permission checks and automatic chmod +x
- Cross-platform compatibility

**Usage:**
```cmd
# Windows
dev-start.bat

# Linux/macOS  
chmod +x dev-start.sh && ./dev-start.sh
```

## 📱 Core Functionality

### Navigation Structure
- **Home** - Dashboard with overview and quick actions
- **Chatbot** - AI personality interaction with mood selection
- **Tasks** - Comprehensive task management with mommy multiplier system
- **Calendar** - Visual calendar with task integration and ICS import
- **Voice** - Speech interaction and voice commands
- **Profile** - User settings and personality level configuration

### Mommy Level Behavior
1. **Level 1-2** (Sweet Mommy): Gentle reminders, encouraging language
2. **Level 3-4** (Caring Mommy): More assertive, helpful suggestions
3. **Level 5-6** (Firm Mommy): Direct communication, clear expectations
4. **Level 7-8** (Strict Mommy): Demanding tone, performance focus
5. **Level 9-10** (Alpha Mommy): Maximum strictness, zero tolerance

### Task Urgency Calculation
- **Base Categories**: Overdue, Critical (≤2h), Urgent (≤12h), Upcoming
- **Mommy Multiplier**: Adjusts time thresholds based on personality level
- **Visual Indicators**: Color-coded task cards with status badges
- **Smart Sorting**: Automatically prioritizes by deadline and importance

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

### 🔧 Project Structure
```
app/
├── (tabs)/                   # Tab navigation screens
│   ├── home.tsx             # Study dashboard with stats and achievements
│   ├── second.tsx           # Advanced task manager with mommy multiplier
│   ├── third.tsx            # Calendar view with task visualization
│   ├── voice.tsx            # Voice interaction interface
│   ├── profile.tsx          # User profile and settings
│   └── chatbot.tsx          # AI chatbot with personality system
├── components/              # Reusable UI components
│   ├── StandardHeader.tsx         # Consistent header component
│   └── MommyAIResponse.tsx        # AI response system
├── contexts/                # Global state management
│   ├── AppContext.tsx       # Authentication and app state
│   ├── TaskContext.tsx      # Task management state
│   └── MommyLevelContext.tsx # Mommy personality state
├── utils/                   # Core utilities
│   ├── mommyPersonality.ts  # 10-level personality system
│   ├── enhancedAI.ts        # Contextual AI response generation
│   ├── ultraSimpleAI.ts     # Multi-provider AI service
│   └── supabaseTaskService.ts # Database operations
└── database/                # Supabase schema and migrations
```

### 🎯 Core Technologies
- **Expo** ~53.0.20 - React Native framework with latest features
- **TypeScript** - Complete type safety and IntelliSense
- **Supabase** - PostgreSQL backend with real-time subscriptions
- **Ollama** - Local AI inference for unlimited free responses
- **React Context** - Global state management without Redux
- **AsyncStorage** - Persistent local storage for user preferences

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
3. Run `dev-start.bat` and choose option 1 (First Time Setup)
4. For daily use, run `dev-start.bat` and choose option 2 (Daily Development)
5. **✅ Full AI-powered task manager ready!** 🎉

> **For teammates:** Just install Node.js + Ollama, then copy the project folder. The batch file handles everything automatically including model downloads and dependency setup!

**📱 Alternative Script (Cross-Platform):**
```bash
# For macOS/Linux users
chmod +x dev-start.sh
./dev-start.sh
```

**Manual Setup (Any Platform):**
1. Clone repo and install: `npm install`
2. Set up `.env` with your Supabase and AI API keys
3. Install Ollama and pull model: `ollama pull llama3.2`
4. Start Ollama with network access: `$env:OLLAMA_HOST="0.0.0.0"; ollama serve`
5. Start development server: `npx expo start`
6. **✅ Demo the mommy AI personality system!** 🚀

## 🔥 Demo Highlights

### 🤖 **Mommy AI Personality System**
- **Levels 0-1 (Sweet)**: Gentle encouragement, heart icons, caring language
- **Levels 2-4 (Caring)**: Supportive guidance, happy icons, motivational speech
- **Levels 5-7 (Firm)**: Direct oversight, business icons, assertive communication
- **Levels 8-9 (Alpha)**: Commanding presence, lightning icons, authoritative tone

### 📋 **Intelligent Task Urgency**
- **Mommy Multiplier**: Higher personality levels make tasks appear more urgent
- **Visual Indicators**: Color-coded priority with dynamic thresholds
- **Smart Notifications**: AI popup frequency adapts to personality level

### 🎨 **Advanced UI Features**
- **Floating AI Navigator**: Draggable, persistent AI assistant across all pages
- **Standardized Headers**: Consistent design with personality indicators
- **Global State Sync**: Mommy level changes instantly reflect everywhere

## 💝 What Makes This Special

This isn't just another task manager - it's a **personality-driven AI companion** that adapts its behavior based on your chosen "mommy level." From sweet and encouraging to firm and commanding, the AI's responses, visual design, and interaction patterns all change dynamically.

**Perfect for demonstrating:**
- Advanced React Native architecture with Context API
- Multi-provider AI integration with intelligent fallbacks
- Complex animation systems with persistent user preferences
- Real-time state synchronization across multiple screens
- Innovative UX patterns like floating, draggable interfaces

## 📱 Platform Support

- **Web** - Works with localhost endpoints
- **Android Emulator** - Uses 10.0.2.2 endpoint
- **Physical Device** - Uses your local IP address
- **iOS Simulator** - Works with localhost endpoints

## 🤝 Contributing

Built for SMU Hackathon - feel free to extend and improve!

## 📄 License

Open source - perfect for hackathon projects and learning!
