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
      /*if (this.currentUserId === userId && this.cachedMommyLvl !== undefined && this.cachedPersonalityType !== undefined) {
        return { mommyLvl: this.cachedMommyLvl, personalityType: this.cachedPersonalityType };
      }*/

      const { data, error } = await supabase
        .from("Profiles")
        .select("mommy_lvl, ai_personality")
        .eq("id", userId)
        .single();
      console.log(data);
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
    
    // Context-aware response selection
    if (msg.match(/^(hi|hello|hey|sup)$/)) {
      return this.getGreetingResponse(mommyLvl, personalityType);
    }

    if (msg.includes('help') || msg.includes('what can you')) {
      return this.getHelpResponse(mommyLvl, personalityType);
    }

    if (msg.includes('code') || msg.includes('app') || msg.includes('react') || msg.includes('program')) {
      return this.getCodingResponse(mommyLvl, personalityType);
    }

    if (msg.includes('time') || msg.includes('date')) {
      const now = new Date();
      return this.getTimeResponse(now, mommyLvl, personalityType);
    }

    if (msg.includes('thank')) {
      return this.getThankYouResponse(mommyLvl, personalityType);
    }

    if (msg.includes('how are you')) {
      return this.getWellbeingResponse(mommyLvl, personalityType);
    }

    // Enhanced math detection
    if (msg.includes('+') || msg.includes('-') || msg.includes('*') || msg.includes('/')) {
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
          case '/': result = b !== 0 ? a / b : 'undefined'; break;
        }
        return this.getMathResponse(a, operator, b, result, mommyLvl, personalityType);
      }
      return this.getMathHelpResponse(mommyLvl, personalityType);
    }

    if (msg.includes('hackathon') || msg.includes('competition')) {
      return this.getHackathonResponse(mommyLvl, personalityType);
    }

    // Dynamic short responses
    if (msg.length < 10) {
      return this.getShortResponse(mommyLvl, personalityType);
    }

    if (msg.includes('?')) {
      return this.getQuestionResponse(mommyLvl, personalityType);
    }

    // Default responses
    return this.getDefaultResponse(mommyLvl, personalityType);
  }

  // Fierceness level transformations
  private applyFiercenessLevel(response: string, mommyLvl: number): string {
    if (mommyLvl <= 1) {
      // Ultra sweet
      return response + " 💕✨";
    } else if (mommyLvl <= 3) {
      // Balanced warmth
      return response;
    } else if (mommyLvl <= 5) {
      // Firm but caring
      return response.replace(/!$/, ".").replace(/Great|Awesome/gi, "Good") + " 👍";
    } else if (mommyLvl <= 7) {
      // Demanding
      return response.replace(/Let's|I can/gi, "You should") + " Focus! 🔥";
    } else {
      // Ruthlessly commanding
      return response.replace(/Let's|I can|You should/gi, "You WILL") + " NOW! 👑💥";
    }
  }

  // Communication style transformations
  private applyCommunicationStyle(response: string, personalityType: number, mommyLvl: number): string {
    const styleTransforms = {
      0: (r: string) => r + (mommyLvl < 4 ? " 😊" : " 👍"), // Friendly
      1: (r: string) => r.replace(/interesting/gi, "fascinating").replace(/good/gi, "intellectually stimulating") + " 🤓", // Smart
      2: (r: string) => r.replace(/Let's/gi, "We shall").replace(/!/g, ".") + " 💼", // Professional
      3: (r: string) => this.addHumor(r, mommyLvl) + " 😂", // Funny
      4: (r: string) => this.addSarcasm(r, mommyLvl) + " 😏", // Sarcastic
      5: (r: string) => r.toUpperCase().replace(/GOOD/g, "MAGNIFICENT") + "! 🎭", // Dramatic
      6: (r: string) => "Hmm... " + r.replace(/what/gi, "what deeper meaning") + " 🤔", // Philosophical
      7: (r: string) => r.replace(/good/gi, "AMAZING").replace(/!/g, "!!") + " LET'S GO! 🔥", // Motivational
      8: (r: string) => r.replace(/Great/gi, "Cool").replace(/!/g, ".") + " 😎", // Cool
      9: (r: string) => "PROCESSING: " + r.replace(/I/gi, "SYSTEM") + " 🤖" // Robotic
    };

    const transform = styleTransforms[personalityType as keyof typeof styleTransforms];
    return transform ? transform(response) : response;
  }

  // Specific response generators for different contexts
  private getGreetingResponse(mommyLvl: number, personalityType: number): string {
    const greetings = {
      gentle: ["Hey there!", "Hello sweetie!", "Hi love!", "Welcome back!"],
      balanced: ["Hey!", "Hello!", "Hi there!", "What's up!"],
      firm: ["Greetings.", "Hello.", "You're here.", "Ready to work?"],
      demanding: ["About time.", "Finally.", "Let's get started.", "You're late."],
      commanding: ["ATTENTION.", "REPORT.", "SPEAK.", "WHAT DO YOU NEED."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = greetings[category][Math.floor(Math.random() * greetings[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getHelpResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["I'm here for you! What do you need help with?", "Of course I'll help! What's troubling you?"],
      balanced: ["I can help! What do you need?", "Sure thing! What's the issue?"],
      firm: ["State your problem.", "What needs fixing?"],
      demanding: ["What can't you figure out yourself?", "Speak up. What's the issue?"],
      commanding: ["REPORT YOUR ISSUE.", "SPECIFY YOUR REQUIREMENT."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getCodingResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["I love talking about code! What are you building?", "Programming is wonderful! Tell me about your project!"],
      balanced: ["Code talk! What's the challenge?", "Development question? I'm listening!"],
      firm: ["State your coding problem.", "What's broken in your code?"],
      demanding: ["Your code better be clean. What's the issue?", "Don't tell me you can't debug this yourself."],
      commanding: ["SHOW ME YOUR CODE. NOW.", "REPORT TECHNICAL SPECIFICATIONS."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getMathResponse(a: number, operator: string, b: number, result: any, mommyLvl: number, personalityType: number): string {
    const base = `${a} ${operator} ${b} = ${result}`;
    
    const comments = {
      gentle: [" Great job asking!", " You're so smart!", " Math is fun!"],
      balanced: [" There you go!", " Simple math!", " Easy!"],
      firm: [" Basic calculation.", " Elementary.", " Next."],
      demanding: [" Even a calculator knows this.", " Seriously?", " Try harder problems."],
      commanding: [" COMPUTED.", " CALCULATION COMPLETE.", " NEXT EQUATION."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const comment = comments[category][Math.floor(Math.random() * comments[category].length)];
    const response = base + comment;
    return this.applyCommunicationStyle(response, personalityType, mommyLvl);
  }

  private getDefaultResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["That sounds interesting! Tell me more!", "I'd love to hear about that!", "You have my attention!"],
      balanced: ["Interesting! Go on.", "Tell me more about that.", "I'm listening."],
      firm: ["Continue.", "Elaborate.", "And?"],
      demanding: ["Get to the point.", "What's your point?", "So what?"],
      commanding: ["ELABORATE IMMEDIATELY.", "CLARIFY.", "SPECIFY."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  // Helper methods for specific personality styles
  private addHumor(response: string, mommyLvl: number): string {
    const jokes = mommyLvl > 6 ? 
      ["Seriously though,", "No joke,", "For real,"] :
      ["Haha,", "LOL,", "That's funny!"];
    return jokes[Math.floor(Math.random() * jokes.length)] + " " + response;
  }

  private addSarcasm(response: string, mommyLvl: number): string {
    if (mommyLvl > 6) {
      return "Oh, " + response.toLowerCase() + " How... original.";
    }
    return "Well, " + response.toLowerCase() + " Interesting choice.";
  }

  // Additional response methods for other contexts
  private getTimeResponse(now: Date, mommyLvl: number, personalityType: number): string {
    const base = `It's ${now.toLocaleTimeString()}`;
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getThankYouResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["Aww, you're so welcome!", "My pleasure, sweetie!"],
      balanced: ["You're welcome!", "Happy to help!"],
      firm: ["You're welcome.", "No problem."],
      demanding: ["You should thank me.", "About time."],
      commanding: ["ACKNOWLEDGED.", "GRATITUDE REGISTERED."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getWellbeingResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["I'm doing wonderful, thank you for asking!", "Great! How are you, love?"],
      balanced: ["Doing great! How about you?", "Good! What about you?"],
      firm: ["Fine. You?", "Functional."],
      demanding: ["I'm fine. Focus on yourself.", "Why does it matter?"],
      commanding: ["STATUS: OPERATIONAL.", "IRRELEVANT. YOUR STATUS?"]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getHackathonResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["Hackathons are so exciting! What's your project?", "I love hackathons! Tell me about your idea!"],
      balanced: ["Cool! What are you building?", "Hackathon time! What's the project?"],
      firm: ["What are you building?", "Show me your progress."],
      demanding: ["You better be winning this.", "Don't disappoint me."],
      commanding: ["DEMONSTRATE YOUR PROJECT.", "REPORT DEVELOPMENT STATUS."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getShortResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["Tell me more!", "Go on, sweetie!", "I'm listening!"],
      balanced: ["Continue!", "And?", "More details?"],
      firm: ["Elaborate.", "Continue.", "More."],
      demanding: ["Speak up.", "Get to it.", "What else?"],
      commanding: ["ELABORATE.", "CONTINUE.", "MORE DATA."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getQuestionResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["Great question! Let me think about that!", "Ooh, I love questions!"],
      balanced: ["Good question! Let's explore this.", "Interesting question!"],
      firm: ["State your question clearly.", "What exactly are you asking?"],
      demanding: ["Make your question clearer.", "Ask better questions."],
      commanding: ["REFORMULATE QUERY.", "SPECIFY PARAMETERS."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }

  private getMathHelpResponse(mommyLvl: number, personalityType: number): string {
    const responses = {
      gentle: ["I can help with math! Try asking me '5 + 3'!", "Math questions are welcome!"],
      balanced: ["I can do math! Try '5 + 3'.", "Ask me a math question!"],
      firm: ["Give me a calculation.", "Try: 5 + 3"],
      demanding: ["Show me some real math.", "Don't waste my time with easy problems."],
      commanding: ["INPUT MATHEMATICAL EXPRESSION.", "PROVIDE CALCULATION REQUEST."]
    };

    let category;
    if (mommyLvl <= 1) category = 'gentle';
    else if (mommyLvl <= 3) category = 'balanced';
    else if (mommyLvl <= 5) category = 'firm';
    else if (mommyLvl <= 7) category = 'demanding';
    else category = 'commanding';

    const base = responses[category][Math.floor(Math.random() * responses[category].length)];
    return this.applyCommunicationStyle(base, personalityType, mommyLvl);
  }
}

export default new UltraSimpleAI();
