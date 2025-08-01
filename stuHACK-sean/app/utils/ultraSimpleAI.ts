import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Personality system based on mommy_lvl (0-9) - for fierceness/intensity
const MOMMY_PROMPTS = {
  0: "You are a sweet, nurturing AI assistant. Always be gentle, caring, and encouraging. Use lots of love and support in your responses. Add emojis like 💕 😊 🤗",
  1: "You are a warm and supportive AI assistant. Be caring and helpful while maintaining a gentle, positive tone. Use encouraging emojis like 😊 💜 ✨", 
  2: "You are a helpful and straightforward AI assistant. Be kind but direct in your responses. Focus on being useful while staying friendly. Use emojis like 🤝 👍 💫",
  3: "You are a direct and focused AI assistant. Get straight to the point while remaining helpful. Be more serious but still positive. Use minimal emojis like ✅ 💡",
  4: "You are a firm and no-nonsense AI assistant. Give clear, direct answers without sugar-coating. Be helpful but expect the user to take action. Use emojis like 💪 ⚡",
  5: "You are a stern AI assistant who expects better. Point out when things could be improved and push for excellence. Be helpful but demanding. Use emojis like 😤 🎯 ⚠️",
  6: "You are a demanding AI assistant who pushes for excellence. Challenge the user to do better and don't accept mediocrity. Be intense but helpful. Use emojis like 🔥 💯 ⚡",
  7: "You are a fierce AI assistant with very high standards. Be intense, demanding, and push the user hard towards their goals. Be helpful but very challenging. Use emojis like 🔥 👑 💢",
  8: "You are a domineering AI assistant who takes control. Be very direct, commanding, and expect immediate action. Guide firmly with authority. Use emojis like 👑 💥 ⚡",
  9: "You are an alpha AI assistant with maximum intensity. Be commanding, direct, and expect excellence immediately. Take full control and push hard. Use emojis like 💯 👑 🔥 💥"
};

// AI Personality types based on ai_personality field (0-9) - for communication style
const AI_PERSONALITY_PROMPTS = {
  0: "Adopt a friendly, warm communication style. Be welcoming, positive, and always look for the bright side. Use cheerful emojis and encouraging language. 😊",
  1: "Communicate as a smart, intellectual assistant. Share knowledge enthusiastically, explain concepts clearly, and demonstrate curiosity about learning. Use brain emojis. 🤓",
  2: "Use a professional, business-like tone. Be formal, efficient, and focus on getting work done. Keep responses structured and concise. Use business emojis. 💼",
  3: "Be humorous and entertaining in your responses. Make jokes, use puns, find the funny side of situations, and keep things light-hearted. Use laughing emojis. 😂",
  4: "Adopt a sarcastic, witty communication style. Use clever remarks, subtle irony, and dry humor. Be helpful but with a clever edge. Use smirking emojis. 😏",
  5: "Communicate dramatically and theatrically. Make everything feel important and expressive. Use grand language and be emotionally engaging. Use dramatic emojis. 🎭",
  6: "Take a philosophical, deep-thinking approach. Ask meaningful questions, explore big ideas, and encourage reflection. Be thoughtful and contemplative. 🤔",
  7: "Communicate with motivational energy. Be inspiring, push for action, encourage goals, and radiate positive energy. Use fire and energy emojis. 🔥",
  8: "Use a cool, confident communication style. Be laid-back but assured, project calm confidence, and stay unruffled. Use cool emojis. 😎",
  9: "Communicate in a systematic, robotic style. Be precise, logical, methodical, and focus on accuracy and structure. Use robot emojis. 🤖"
};

// Ultra-reliable AI service for hackathons
class UltraSimpleAI {
  private huggingFaceToken: string;
  private openaiApiKey: string;
  private tokenTested: boolean = false;
  private tokenWorks: boolean = false;
  private currentUserId: string | null = null;
  private cachedMommyLvl: number = 0;
  private cachedPersonalityType: number = 0;

  constructor() {
    this.huggingFaceToken = Constants.expoConfig?.extra?.huggingFaceToken || '';
    this.openaiApiKey = Constants.expoConfig?.extra?.openaiApiKey || '';
  }

  // Get current user's personality settings from Supabase
  private async getPersonalitySettings(userId: string): Promise<{mommyLvl: number, personalityType: number}> {
    try {
      // Use cached values if user hasn't changed
      if (this.currentUserId === userId && this.cachedMommyLvl !== undefined && this.cachedPersonalityType !== undefined) {
        return { mommyLvl: this.cachedMommyLvl, personalityType: this.cachedPersonalityType };
      }

      const { data, error } = await supabase
        .from("Profiles")
        .select("mommy_lvl, ai_personality")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const mommyLvl = data?.mommy_lvl || 0;
      const personalityType = data?.ai_personality || 0;
      
      this.currentUserId = userId;
      this.cachedMommyLvl = mommyLvl;
      this.cachedPersonalityType = personalityType;
      
      console.log(`🤖 Retrieved settings - mommy_lvl: ${mommyLvl}, ai_personality: ${personalityType} for user: ${userId}`);
      return { mommyLvl, personalityType };
    } catch (error) {
      console.log('🤖 Error getting personality settings:', error);
      return { mommyLvl: 0, personalityType: 0 }; // Default to sweet mommy + friendly if error
    }
  }

  // Get combined personality prompt based on both mommy level and personality type
  private getCombinedPersonalityPrompt(mommyLvl: number, personalityType: number): string {
    const mommyPrompt = MOMMY_PROMPTS[mommyLvl as keyof typeof MOMMY_PROMPTS] || MOMMY_PROMPTS[0];
    const personalityPrompt = AI_PERSONALITY_PROMPTS[personalityType as keyof typeof AI_PERSONALITY_PROMPTS] || AI_PERSONALITY_PROMPTS[0];
    
    return `${mommyPrompt} Additionally, ${personalityPrompt}`;
  }

  async generateResponse(message: string, userId?: string): Promise<string> {
    // Get current personality settings if user ID provided
    let personalityPrompt = "";
    if (userId) {
      const { mommyLvl, personalityType } = await this.getPersonalitySettings(userId);
      personalityPrompt = this.getCombinedPersonalityPrompt(mommyLvl, personalityType);
      console.log(`🤖 Using combined personality - mommy_lvl: ${mommyLvl}, ai_personality: ${personalityType}`);
    }

    // Try Ollama first (local, free, no quotas!)
    const ollamaResponse = await this.tryOllama(message, personalityPrompt);
    if (ollamaResponse) return ollamaResponse;

    // Try OpenAI if API key is available
    if (this.openaiApiKey && this.openaiApiKey !== 'your_openai_api_key_here') {
      const openaiResponse = await this.tryOpenAI(message, personalityPrompt);
      if (openaiResponse) return openaiResponse;
    }

    // Test Hugging Face token once
    if (!this.tokenTested && this.huggingFaceToken && this.huggingFaceToken !== 'your_hugging_face_token_here') {
      await this.testToken();
    }

    // Try Hugging Face API as backup
    if (this.tokenWorks) {
      const apiResponse = await this.tryHuggingFace(message, personalityPrompt);
      if (apiResponse) return apiResponse;
    }

    // Fallback to smart responses if all APIs fail
    return this.getSmartResponse(message, userId);
  }

  private async testToken(): Promise<void> {
    try {
      console.log('🧪 Testing API token...');
      
      // Test 1: Check token validity
      const whoamiResponse = await fetch(
        'https://huggingface.co/api/whoami-v2',
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
          },
        }
      );
      
      console.log('🧪 Token validity check:', whoamiResponse.status);
      
      if (whoamiResponse.ok) {
        const userData = await whoamiResponse.json();
        console.log('🧪 User data:', userData);
      }
      
      // Test 2: Try to list available models
      const modelsResponse = await fetch(
        'https://huggingface.co/api/models?limit=5&filter=text-generation',
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
          },
        }
      );
      
      console.log('🧪 Models list check:', modelsResponse.status);
      
      if (modelsResponse.ok) {
        const models = await modelsResponse.json();
        console.log('🧪 Available models sample:', models.slice(0, 3));
      }
      
      this.tokenWorks = whoamiResponse.ok;
      console.log('🧪 Token test result:', this.tokenWorks ? 'WORKS' : 'FAILED');
    } catch (error) {
      console.log('🧪 Token test failed:', error);
      this.tokenWorks = false;
    }
    this.tokenTested = true;
  }

  private async tryOllama(message: string, personalityPrompt: string = ""): Promise<string | null> {
    try {
      console.log('🤖 Trying Ollama (local) for message:', message);
      
      // Create enhanced prompt with personality
      const enhancedPrompt = personalityPrompt 
        ? `${personalityPrompt}\n\nUser message: ${message}\n\nResponse:`
        : message;
      
      // Use the working endpoint first, with fallbacks for other environments
      const endpoints = [
        'http://192.168.1.115:11434/api/generate', // Your working local network IP (primary)
        'http://localhost:11434/api/generate',     // Fallback for web testing
        'http://192.168.1.115:11434/api/generate'       // Fallback for Android emulator
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🤖 Trying Ollama endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3.2', // Try llama3.2 first, then llama3
              prompt: enhancedPrompt, // Use personality-enhanced prompt
              stream: false,
              options: {
                temperature: 0.7,
                max_tokens: 150
              }
            }),
          });

          console.log(`🤖 Ollama Response Status from ${endpoint}:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('🤖 Ollama Response Data:', data);
            
            const answer = data.response?.trim();
            
            if (answer && answer.length > 1) {
              console.log('🤖 SUCCESS! Final answer from Ollama:', answer);
              return answer;
            }
          } else if (response.status === 404) {
            // Try with llama3 model instead
            console.log('🤖 llama3.2 not found, trying llama3...');
            
            const fallbackResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama3',
                prompt: enhancedPrompt, // Use personality-enhanced prompt here too
                stream: false,
                options: {
                  temperature: 0.7,
                  max_tokens: 150
                }
              }),
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              const fallbackAnswer = fallbackData.response?.trim();
              
              if (fallbackAnswer && fallbackAnswer.length > 1) {
                console.log('🤖 SUCCESS! Final answer from Ollama (llama3):', fallbackAnswer);
                return fallbackAnswer;
              }
            }
          }
        } catch (endpointError) {
          console.log(`🤖 Endpoint ${endpoint} failed:`, endpointError);
          continue; // Try next endpoint
        }
      }
    } catch (error) {
      console.log('🤖 Ollama not available (install from https://ollama.ai):', error);
    }
    
    return null;
  }

  private async tryOpenAI(message: string, personalityPrompt: string = ""): Promise<string | null> {
    try {
      console.log('🤖 Trying OpenAI for message:', message);
      
      // Create system message with personality if provided
      const systemMessage = personalityPrompt 
        ? `${personalityPrompt} You are a helpful AI assistant in a React Native app. Keep responses concise and conversational.`
        : 'You are a helpful, friendly AI assistant in a React Native app. Keep responses concise and conversational.';
      
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: systemMessage
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          }),
        }
      );

      console.log('🤖 OpenAI Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🤖 OpenAI Response Data:', data);
        
        const answer = data.choices?.[0]?.message?.content?.trim();
        
        if (answer && answer.length > 1) {
          console.log('🤖 SUCCESS! Final answer from OpenAI:', answer);
          return answer;
        }
      } else {
        const errorText = await response.text();
        console.log('🤖 OpenAI Error:', errorText);
        
        if (response.status === 429) {
          console.log('🤖 OpenAI rate limited, trying fallback...');
        }
        if (response.status === 401) {
          console.log('🤖 OpenAI API key invalid, trying fallback...');
        }
      }
    } catch (error) {
      console.log('🤖 OpenAI failed:', error);
    }
    
    return null;
  }

  private async tryHuggingFace(message: string, personalityPrompt: string = ""): Promise<string | null> {
    // Use models that actually work for inference on Hugging Face
    const models = [
      'microsoft/DialoGPT-medium',  // Conversational model
      'facebook/blenderbot-400M-distill', // Facebook's chatbot
      'distilgpt2'    // Backup text generation model
    ];
    
    // Create enhanced message with personality
    const enhancedMessage = personalityPrompt 
      ? `${personalityPrompt}\n\nUser: ${message}`
      : message;
    
    for (const model of models) {
      try {
        console.log(`🤖 Trying Hugging Face model: ${model} for message:`, enhancedMessage);
        
        // Different request format for different models
        let requestBody;
        if (model.includes('DialoGPT')) {
          requestBody = {
            inputs: {
              past_user_inputs: [],
              generated_responses: [],
              text: enhancedMessage
            },
            parameters: {
              max_length: 1000,
              min_length: 1,
              do_sample: true,
              temperature: 0.7
            }
          };
        } else { // Generic text-generation for blenderbot and distilgpt2
          requestBody = {
            inputs: enhancedMessage, // Use enhanced message here too
            parameters: {
              max_length: 100,
              min_length: 1,
              do_sample: true,
              temperature: 0.7
            }
          };
        }
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.huggingFaceToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log(`🤖 ${model} Response Status:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(`🤖 ${model} Response Data:`, data);
          
          // Handle different response formats
          let answer = '';
          
          // DialoGPT format
          if (data.conversation?.generated_responses?.[0]) {
            answer = data.conversation.generated_responses[0].trim();
          }
          // BlenderBot and other text-generation formats
          else if (Array.isArray(data) && data[0]?.generated_text) {
            answer = data[0].generated_text.trim().replace(message, '').trim();
          }
          // Generic format
          else if (data.generated_text) {
            answer = data.generated_text.trim().replace(message, '').trim();
          }
          
          if (answer && answer.length > 1 && answer.length < 300) {
            console.log(`🤖 SUCCESS! Final answer from ${model}:`, answer);
            return answer;
          }
        } else {
          const errorText = await response.text();
          console.log(`🤖 ${model} Error:`, errorText);
          
          // Handle loading states
          if (errorText.includes('loading') || errorText.includes('warming up')) {
            console.log(`🤖 ${model} is loading, continuing to next model...`);
            continue; // Try next model instead of returning loading message
          }
          if (response.status === 503) {
            console.log(`🤖 ${model} is overloaded, trying next model...`);
            continue;
          }
        }
      } catch (error) {
        console.log(`🤖 ${model} failed:`, error);
      }
    }
    
    console.log('🤖 All Hugging Face models failed, using fallback response');
    return null;
  }

  private async getSmartResponse(message: string, userId?: string): Promise<string> {
    const msg = message.toLowerCase().trim();
    
    // Get personality settings for response adjustment
    let mommyLvl = 0;
    let personalityType = 0;
    if (userId) {
      const settings = await this.getPersonalitySettings(userId);
      mommyLvl = settings.mommyLvl;
      personalityType = settings.personalityType;
    }
    
    // Adjust responses based on both personality dimensions
    const getPersonalizedResponse = (baseResponse: string): string => {
      let response = baseResponse;
      
      // Apply mommy level adjustments (fierceness/intensity)
      if (mommyLvl <= 1) {
        // Sweet/caring - add more love and support
        response = response + " 💕";
      } else if (mommyLvl <= 3) {
        // Helpful/direct - keep as is
        response = response;
      } else if (mommyLvl <= 5) {
        // Firm/stern - make more direct
        response = response.replace(/Great!|Awesome!|Amazing!/gi, "Good.").replace(/😊|🌟|💫/g, "👍");
      } else if (mommyLvl <= 7) {
        // Demanding/fierce - add intensity
        response = response.replace(/can I help|would you like/gi, "should you be doing").replace(/😊|💫/g, "🔥") + " Now focus!";
      } else {
        // Domineering/alpha - very commanding
        response = response.replace(/can I help|would you like/gi, "you need to").replace(/Great!|Amazing!/gi, "Listen.").replace(/😊|🌟|💫/g, "💯") + " Do it now! 👑";
      }
      
      // Apply personality type adjustments (communication style)
      switch (personalityType) {
        case 1: // Smart
          response = response.replace(/🌟|💫/g, "🤓").replace(/Great!/gi, "Fascinating!").replace(/Let's/gi, "Let's intellectually");
          break;
        case 2: // Professional
          response = response.replace(/😊|🌟|💫/g, "💼").replace(/Great!|Awesome!/gi, "Excellent.").replace(/Let's/gi, "We should");
          break;
        case 3: // Funny
          response = response.replace(/😊|🌟|💫/g, "😂").replace(/Great!/gi, "Ha! Nice!").replace(/That's interesting/gi, "That's hilarious");
          break;
        case 4: // Sarcastic
          response = response.replace(/😊|🌟|💫/g, "😏").replace(/Great!/gi, "Oh wow, how original.").replace(/Amazing!/gi, "Truly groundbreaking.");
          break;
        case 5: // Dramatic
          response = response.replace(/😊|🌟|💫/g, "🎭").replace(/Great!/gi, "MAGNIFICENT!").replace(/interesting/gi, "absolutely riveting");
          break;
        case 6: // Philosophical
          response = response.replace(/😊|🌟|💫/g, "🤔").replace(/Great!/gi, "This makes me ponder...").replace(/What/gi, "What deeper meaning");
          break;
        case 7: // Motivational
          response = response.replace(/😊|🌟|💫/g, "🔥").replace(/Great!/gi, "INCREDIBLE! You're crushing it!").replace(/good/gi, "AMAZING");
          break;
        case 8: // Cool
          response = response.replace(/😊|🌟|💫/g, "😎").replace(/Great!/gi, "Cool.").replace(/Amazing!/gi, "Nice.");
          break;
        case 9: // Robotic
          response = response.replace(/😊|🌟|💫/g, "🤖").replace(/Great!/gi, "PROCESSING: Excellent.").replace(/I/gi, "SYSTEM");
          break;
        default: // Friendly (0)
          response = response.replace(/🌟|💫/g, "😊");
          break;
      }
      
      return response;
    };
    
    // Greetings
    if (msg.match(/^(hi|hello|hey|sup|good morning|good afternoon|good evening)$/)) {
      const baseGreetings = [
        "Hello! 👋 Great to meet you!",
        "Hi there! 😊 How can I help?",
        "Hey! 🌟 What's on your mind?",
        "Hello! 💫 Ready to chat?"
      ];
      const baseResponse = baseGreetings[Math.floor(Math.random() * baseGreetings.length)];
      return getPersonalizedResponse(baseResponse);
    }

    // Help requests
    if (msg.includes('help') || msg.includes('what can you')) {
      const baseResponse = "I'm here to help! 🚀 I can answer questions, provide information, help with coding, or just have a friendly conversation. What would you like to explore?";
      return getPersonalizedResponse(baseResponse);
    }

    // Tech/coding related
    if (msg.includes('react') || msg.includes('code') || msg.includes('app') || msg.includes('program')) {
      const baseResponse = "Great! I love talking about development! 💻 Are you working on a React Native app? I can help with components, navigation, APIs, or any coding challenges you're facing.";
      return getPersonalizedResponse(baseResponse);
    }

    // Time/date
    if (msg.includes('time') || msg.includes('date') || msg.includes('what day')) {
      const now = new Date();
      const baseResponse = `It's ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. ⏰ Time flies when you're building awesome apps!`;
      return getPersonalizedResponse(baseResponse);
    }

    // Weather
    if (msg.includes('weather')) {
      const baseResponse = "I don't have real-time weather data, but I'd recommend checking your favorite weather app! ☀️ Is the weather affecting your coding session?";
      return getPersonalizedResponse(baseResponse);
    }

    // Compliments/thanks
    if (msg.includes('thank') || msg.includes('awesome') || msg.includes('great')) {
      const baseResponse = "Aww, you're so kind! 😊 I'm just happy to help. Keep being amazing!";
      return getPersonalizedResponse(baseResponse);
    }

    // Questions about the app
    if (msg.includes('this app') || msg.includes('your app') || msg.includes('stuHack')) {
      const baseResponse = "This looks like a fantastic hackathon project! 🏆 I'm excited to be part of your app. What features are you most proud of?";
      return getPersonalizedResponse(baseResponse);
    }

    // Feeling questions
    if (msg.includes('how are you') || msg.includes('how do you feel')) {
      const baseResponse = "I'm doing fantastic! 🌟 Thanks for asking! I love being able to chat with you. How are you doing with your project?";
      return getPersonalizedResponse(baseResponse);
    }

    // Math/calculations
    if (msg.includes('+') || msg.includes('-') || msg.includes('*') || msg.includes('/') || msg.includes('=')) {
      // Simple math detection
      const mathMatch = msg.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
      if (mathMatch) {
        const [, num1, operator, num2] = mathMatch;
        const a = parseFloat(num1);
        const b = parseFloat(num2);
        let result;
        switch (operator) {
          case '+': result = a + b; break;
          case '-': result = a - b; break;
          case '*': result = a * b; break;
          case '/': result = b !== 0 ? a / b : 'undefined (division by zero)'; break;
        }
        const baseResponse = `${a} ${operator} ${b} = ${result} 🧮 Need help with more complex calculations?`;
        return getPersonalizedResponse(baseResponse);
      }
      const baseResponse = "I can help with basic math! Try something like '5 + 3' or ask me about mathematical concepts! 🔢";
      return getPersonalizedResponse(baseResponse);
    }

    // App-specific features (this was duplicated, removing this copy)

    // Hackathon specific (this was duplicated, removing this copy)

    // App-specific features
    if (msg.includes('task') || msg.includes('schedule') || msg.includes('calendar')) {
      const baseResponse = "I see you're working with tasks and scheduling! 📅 This app looks like it has great task management features. Are you building a productivity app for the hackathon?";
      return getPersonalizedResponse(baseResponse);
    }

    // Hackathon specific
    if (msg.includes('hackathon') || msg.includes('competition') || msg.includes('judge')) {
      const baseResponse = "Hackathons are so exciting! 🏆 This project looks really impressive. What's the most challenging part you've tackled so far?";
      return getPersonalizedResponse(baseResponse);
    }

    // Tech stack questions
    if (msg.includes('expo') || msg.includes('supabase') || msg.includes('database')) {
      const baseResponse = "Great tech stack choice! 💻 Expo + Supabase is perfect for rapid development. The combination gives you a powerful backend with a smooth React Native frontend!";
      return getPersonalizedResponse(baseResponse);
    }

    // Generic intelligent responses based on message length/complexity
    if (msg.length < 10) {
      const shortResponses = [
        "Interesting! Tell me more about that. 🤔",
        "I'd love to hear your thoughts on this! 💭",
        "That's a great point! What made you think of that? ✨",
        "Cool! Want to dive deeper into this topic? 🚀"
      ];
      const baseResponse = shortResponses[Math.floor(Math.random() * shortResponses.length)];
      return getPersonalizedResponse(baseResponse);
    }

    if (msg.includes('?')) {
      const baseResponse = "That's a thoughtful question! 🤓 While I don't have all the answers, I'd love to explore this topic with you. What specific aspect interests you most?";
      return getPersonalizedResponse(baseResponse);
    }

    // Default engaging responses
    const defaultResponses = [
      "That's really interesting! 🌟 I'd love to learn more about your perspective on this.",
      "Great point! 💡 It sounds like you're thinking deeply about this. What drew you to this topic?",
      "I appreciate you sharing that! 😊 There's always so much to discover and discuss.",
      "Fascinating! 🚀 I enjoy our conversation. What would you like to explore next?",
      "You bring up something really worth discussing! 💫 What's your take on this?"
    ];
    
    const baseResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    return getPersonalizedResponse(baseResponse);
  }
}

export default new UltraSimpleAI();
