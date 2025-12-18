import { getCombinedPersonalityPrompt, MOMMY_PROMPTS, AI_PERSONALITY_PROMPTS } from './prompts';

interface PersonalitySettings {
    mommyLvl: number;
    personalityType: number;
}

interface OrchestratorConfig {
    openaiApiKey?: string;
    huggingFaceToken?: string;
    ollamaEndpoints?: string[];
}

/**
 * LLM Orchestrator - handles AI response generation with multiple provider fallbacks
 * 
 * Priority order:
 * 1. Ollama (local, free)
 * 2. OpenAI (if API key provided)
 * 3. HuggingFace (if token provided)
 * 4. Smart fallback responses
 */
export class LLMOrchestrator {
    private config: OrchestratorConfig;
    private tokenTested: boolean = false;
    private tokenWorks: boolean = false;

    constructor(config: OrchestratorConfig = {}) {
        this.config = {
            openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
            huggingFaceToken: config.huggingFaceToken || process.env.HUGGING_FACE_TOKEN || '',
            ollamaEndpoints: config.ollamaEndpoints ||
                (process.env.OLLAMA_ENDPOINTS?.split(',') || ['http://localhost:11434/api/generate'])
        };
    }

    /**
     * Generate a response using available LLM providers
     */
    async generateResponse(
        message: string,
        personality: PersonalitySettings = { mommyLvl: 0, personalityType: 0 }
    ): Promise<string> {
        const personalityPrompt = getCombinedPersonalityPrompt(
            personality.mommyLvl,
            personality.personalityType
        );

        console.log(`🤖 Orchestrator: Using personality - mommy_lvl: ${personality.mommyLvl}, ai_personality: ${personality.personalityType}`);

        // Try Ollama first (local, free, no quotas!)
        const ollamaResponse = await this.tryOllama(message, personalityPrompt);
        if (ollamaResponse) return ollamaResponse;

        // Try OpenAI if API key is available
        if (this.config.openaiApiKey && this.config.openaiApiKey !== 'your_openai_api_key_here') {
            const openaiResponse = await this.tryOpenAI(message, personalityPrompt);
            if (openaiResponse) return openaiResponse;
        }

        // Test Hugging Face token once
        if (!this.tokenTested && this.config.huggingFaceToken && this.config.huggingFaceToken !== 'your_hugging_face_token_here') {
            await this.testToken();
        }

        // Try Hugging Face API as backup
        if (this.tokenWorks) {
            const apiResponse = await this.tryHuggingFace(message, personalityPrompt);
            if (apiResponse) return apiResponse;
        }

        // Fallback to smart responses if all APIs fail
        return this.getSmartResponse(message, personality);
    }

    private async testToken(): Promise<void> {
        try {
            console.log('🧪 Testing HuggingFace API token...');

            const whoamiResponse = await fetch(
                'https://huggingface.co/api/whoami-v2',
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.huggingFaceToken}`,
                    },
                }
            );

            this.tokenWorks = whoamiResponse.ok;
            console.log('🧪 Token test result:', this.tokenWorks ? 'WORKS' : 'FAILED');
        } catch (error) {
            console.log('🧪 Token test failed:', error);
            this.tokenWorks = false;
        }
        this.tokenTested = true;
    }

    private async tryOllama(message: string, personalityPrompt: string = ""): Promise<string | null> {
        const enhancedPrompt = personalityPrompt
            ? `${personalityPrompt}\n\nUser message: ${message}\n\nResponse:`
            : message;

        for (const endpoint of this.config.ollamaEndpoints || []) {
            try {
                console.log(`🤖 Trying Ollama endpoint: ${endpoint}`);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama3.2',
                        prompt: enhancedPrompt,
                        stream: false,
                        options: {
                            temperature: 0.7,
                            max_tokens: 150
                        }
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const answer = data.response?.trim();

                    if (answer && answer.length > 1) {
                        console.log('🤖 SUCCESS! Response from Ollama');
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
                            prompt: enhancedPrompt,
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
                            console.log('🤖 SUCCESS! Response from Ollama (llama3)');
                            return fallbackAnswer;
                        }
                    }
                }
            } catch (endpointError) {
                console.log(`🤖 Endpoint ${endpoint} failed:`, endpointError);
                continue;
            }
        }

        return null;
    }

    private async tryOpenAI(message: string, personalityPrompt: string = ""): Promise<string | null> {
        try {
            console.log('🤖 Trying OpenAI...');

            const systemMessage = personalityPrompt
                ? `${personalityPrompt} You are a helpful AI assistant. Keep responses concise and conversational.`
                : 'You are a helpful, friendly AI assistant. Keep responses concise and conversational.';

            const response = await fetch(
                'https://api.openai.com/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.openaiApiKey}`,
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

            if (response.ok) {
                const data = await response.json();
                const answer = data.choices?.[0]?.message?.content?.trim();

                if (answer && answer.length > 1) {
                    console.log('🤖 SUCCESS! Response from OpenAI');
                    return answer;
                }
            } else {
                const errorText = await response.text();
                console.log('🤖 OpenAI Error:', response.status, errorText);
            }
        } catch (error) {
            console.log('🤖 OpenAI failed:', error);
        }

        return null;
    }

    private async tryHuggingFace(message: string, personalityPrompt: string = ""): Promise<string | null> {
        const models = [
            'microsoft/DialoGPT-medium',
            'facebook/blenderbot-400M-distill',
            'distilgpt2'
        ];

        const enhancedMessage = personalityPrompt
            ? `${personalityPrompt}\n\nUser: ${message}`
            : message;

        for (const model of models) {
            try {
                console.log(`🤖 Trying HuggingFace model: ${model}`);

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
                } else {
                    requestBody = {
                        inputs: enhancedMessage,
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
                            'Authorization': `Bearer ${this.config.huggingFaceToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    }
                );

                if (response.ok) {
                    const data = await response.json();

                    let answer = '';
                    if (data.conversation?.generated_responses?.[0]) {
                        answer = data.conversation.generated_responses[0].trim();
                    } else if (Array.isArray(data) && data[0]?.generated_text) {
                        answer = data[0].generated_text.trim().replace(message, '').trim();
                    } else if (data.generated_text) {
                        answer = data.generated_text.trim().replace(message, '').trim();
                    }

                    if (answer && answer.length > 1 && answer.length < 300) {
                        console.log(`🤖 SUCCESS! Response from ${model}`);
                        return answer;
                    }
                } else {
                    const errorText = await response.text();
                    if (errorText.includes('loading') || response.status === 503) {
                        continue;
                    }
                }
            } catch (error) {
                console.log(`🤖 ${model} failed:`, error);
            }
        }

        return null;
    }

    private getSmartResponse(message: string, personality: PersonalitySettings): string {
        const msg = message.toLowerCase().trim();
        const { mommyLvl, personalityType } = personality;

        const getPersonalizedResponse = (baseResponse: string): string => {
            let response = baseResponse;

            // Apply mommy level adjustments
            if (mommyLvl <= 1) {
                response = response + " 💕";
            } else if (mommyLvl >= 7) {
                response = response.replace(/Great!|Amazing!/gi, "Listen.") + " Do it now! 👑";
            }

            // Apply personality type adjustments
            switch (personalityType) {
                case 1: response = response.replace(/Great!/gi, "Fascinating!"); break;
                case 2: response = response.replace(/Great!/gi, "Excellent."); break;
                case 3: response = response.replace(/Great!/gi, "Ha! Nice!"); break;
                case 4: response = response.replace(/Great!/gi, "Oh wow, how original."); break;
                case 7: response = response.replace(/Great!/gi, "INCREDIBLE!"); break;
                case 9: response = response.replace(/I/gi, "SYSTEM"); break;
            }

            return response;
        };

        // Greetings
        if (msg.match(/^(hi|hello|hey|sup|good morning|good afternoon|good evening)$/)) {
            const greetings = [
                "Hello! 👋 Great to meet you!",
                "Hi there! 😊 How can I help?",
                "Hey! 🌟 What's on your mind?"
            ];
            return getPersonalizedResponse(greetings[Math.floor(Math.random() * greetings.length)]);
        }

        // Help requests
        if (msg.includes('help') || msg.includes('what can you')) {
            return getPersonalizedResponse("I'm here to help! 🚀 I can answer questions, provide information, or just chat. What would you like to explore?");
        }

        // Default responses
        const defaults = [
            "That's interesting! 🌟 Tell me more about your perspective.",
            "Great point! 💡 What drew you to this topic?",
            "I appreciate you sharing that! 😊",
            "Fascinating! 🚀 What would you like to explore next?"
        ];

        return getPersonalizedResponse(defaults[Math.floor(Math.random() * defaults.length)]);
    }
}

// Default singleton instance
export const orchestrator = new LLMOrchestrator();
