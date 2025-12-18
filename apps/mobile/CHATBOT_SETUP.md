# AI Chatbot Setup Guide

Your React Native app now has an AI chatbot powered by Llama! Here's how to set it up:

## Setup Options

### Option 1: Ollama (Local - Completely Free) ⭐ Recommended
1. **Install Ollama** from https://ollama.ai
2. **Open terminal/command prompt** and run:
   ```bash
   ollama pull llama3
   ollama serve
   ```
3. **That's it!** Your app will automatically connect to the local Ollama server

### Option 2: Hugging Face API (Free Tier)
1. **Sign up** at https://huggingface.co
2. **Get your API token** from https://huggingface.co/settings/tokens
3. **Add to .env file**:
   ```
   HUGGING_FACE_TOKEN=your_token_here
   ```

## How It Works

The chatbot will try to connect in this order:
1. **Ollama (local)** - if running
2. **Hugging Face API** - if token provided
3. **Error message** - if neither available

## Features

- ✅ Clean chat interface
- ✅ Real-time messaging
- ✅ Automatic fallback between APIs
- ✅ Loading states
- ✅ Error handling
- ✅ Timestamps
- ✅ Responsive design

## Available Models

### Ollama (Local)
- `llama3` - Latest and best
- `llama2` - Stable and reliable
- `mistral` - Fast and efficient
- `codellama` - Great for coding help

### Hugging Face
- `meta-llama/Llama-2-7b-chat-hf` - Main model
- `microsoft/DialoGPT-medium` - Alternative conversational model

## Customization

You can customize the chatbot by editing:
- `app/(tabs)/chatbot.tsx` - UI and behavior
- `app/(tabs)/utils/llamaService.ts` - API calls and model selection

## Troubleshooting

**"AI is thinking..." never stops?**
- Check if Ollama is running: `ollama list`
- Verify your Hugging Face token is correct
- Check network connection

**Want to change the model?**
- For Ollama: Change `llama3` to `llama2` or `mistral` in llamaService.ts
- For Hugging Face: Change the model URL in llamaService.ts

**Need faster responses?**
- Use smaller models like `mistral` or `llama2`
- Reduce `max_new_tokens` parameter

## Next Steps

- Add conversation memory
- Implement conversation history storage
- Add voice input/output
- Create specialized prompts for your app's domain
