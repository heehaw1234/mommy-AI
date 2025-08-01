import ultraSimpleAI from '@/app/utils/ultraSimpleAI';
import { supabase } from '@/lib/supabase';

interface ExtractedTask {
    title: string;
    description: string;
    time: string;
    date: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
}

interface TaskExtractionResult {
    tasks: ExtractedTask[];
    originalInput: string;
    confidence: number;
    processingTime: number;
}

class TaskAIService {
    
    /**
     * Extract structured tasks from natural language input
     */
    async extractTasksFromInput(
        input: string, 
        userId?: string,
        contextHints?: {
            currentTime?: Date;
            userPreferences?: any;
            existingTasks?: any[];
        }
    ): Promise<TaskExtractionResult> {
        const startTime = Date.now();
        
        try {
            // Get user's personality for context-aware processing
            let personalityContext = '';
            if (userId) {
                const profile = await this.getUserProfile(userId);
                personalityContext = this.buildPersonalityContext(profile);
            }

            // Build comprehensive prompt with context
            const prompt = this.buildExtractionPrompt(input, personalityContext, contextHints);
            
            console.log('🤖 TaskAI: Processing input with context-aware prompt');
            const aiResponse = await ultraSimpleAI.generateResponse(prompt, userId);
            
            // Parse and validate the response
            const extractedTasks = await this.parseAIResponse(aiResponse, input, contextHints);
            
            // Log interaction for learning (if user is logged in)
            if (userId) {
                await this.logInteraction(userId, input, aiResponse, extractedTasks);
            }
            
            const processingTime = Date.now() - startTime;
            
            return {
                tasks: extractedTasks,
                originalInput: input,
                confidence: this.calculateConfidence(extractedTasks, input),
                processingTime
            };
            
        } catch (error) {
            console.error('❌ TaskAI: Error extracting tasks:', error);
            
            // Fallback to simple extraction
            const fallbackTasks = this.fallbackExtraction(input, contextHints);
            
            return {
                tasks: fallbackTasks,
                originalInput: input,
                confidence: 0.3, // Low confidence for fallback
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * Build a comprehensive prompt for task extraction
     */
    private buildExtractionPrompt(
        input: string, 
        personalityContext: string, 
        contextHints?: any
    ): string {
        const currentTime = contextHints?.currentTime || new Date();
        const todayStr = currentTime.toISOString().split('T')[0];
        const currentTimeStr = currentTime.toTimeString().slice(0, 5);
        
        return `
You are an intelligent task extraction assistant. Extract actionable tasks from natural language input and return them as a structured JSON array.

${personalityContext}

Current context:
- Today's date: ${todayStr}
- Current time: ${currentTimeStr}
- Day of week: ${currentTime.toLocaleDateString('en-US', { weekday: 'long' })}

User input: "${input}"

Instructions:
1. Extract individual, actionable tasks from the input
2. Interpret relative dates/times intelligently (tomorrow, next week, tonight, etc.)
3. Suggest reasonable times if not specified
4. Break down compound tasks if they contain multiple actions
5. Infer priority and category where possible

Return ONLY a JSON array in this exact format:
[
  {
    "title": "Clear, actionable task title (max 60 chars)",
    "description": "Detailed description with context",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "priority": "low|medium|high",
    "category": "work|personal|health|shopping|etc"
  }
]

Examples of good extraction:
- "Buy groceries tomorrow" → Task for tomorrow with reasonable time
- "Call mom tonight" → Task for today evening (19:00-20:00)
- "Meeting with John at 3pm Friday" → Task for next Friday at 15:00
- "Finish report by end of week" → Task for Friday with deadline context
- "Doctor appointment and pick up prescription" → Two separate tasks

Smart date/time interpretation:
- "tonight" = today 19:00-21:00
- "tomorrow morning" = tomorrow 09:00-11:00
- "next week" = next Monday
- "end of week" = this Friday
- "weekend" = this Saturday
- No time specified = suggest appropriate time based on task type

Task categories: work, personal, health, shopping, family, education, finance, travel, household, social

Be intelligent about splitting compound tasks and inferring context.
`;
    }

    /**
     * Parse AI response and validate extracted tasks
     */
    private async parseAIResponse(
        aiResponse: string, 
        originalInput: string, 
        contextHints?: any
    ): Promise<ExtractedTask[]> {
        let tasks: ExtractedTask[] = [];
        
        try {
            // Try to extract JSON from response
            const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                const parsedTasks = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsedTasks)) {
                    tasks = parsedTasks.map(this.validateAndCleanTask);
                }
            }
        } catch (parseError) {
            console.warn('⚠️ TaskAI: Failed to parse AI response as JSON');
        }
        
        // If no valid tasks extracted, use fallback
        if (tasks.length === 0) {
            tasks = this.fallbackExtraction(originalInput, contextHints);
        }
        
        // Final validation and cleanup
        return tasks
            .filter(task => task.title && task.title.trim())
            .map(this.validateAndCleanTask);
    }

    /**
     * Validate and clean individual task
     */
    private validateAndCleanTask = (task: any): ExtractedTask => {
        const now = new Date();
        
        return {
            title: (task.title || 'Untitled Task').trim().slice(0, 60),
            description: (task.description || task.title || '').trim(),
            time: this.validateTime(task.time) || this.suggestTime(task.title),
            date: this.validateDate(task.date) || now.toISOString().split('T')[0],
            priority: this.validatePriority(task.priority),
            category: this.validateCategory(task.category)
        };
    };

    /**
     * Fallback extraction when AI parsing fails
     */
    private fallbackExtraction(input: string, contextHints?: any): ExtractedTask[] {
        const now = contextHints?.currentTime || new Date();
        const suggestedTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        
        // Try to split input into multiple tasks
        const taskSeparators = /(?:\s+and\s+then\s+|\s+then\s+|\s+also\s+|\s+after\s+that\s+|\s+next\s+|,\s*and\s+|;\s*)/i;
        const possibleTasks = input
            .split(taskSeparators)
            .map(t => t.trim())
            .filter(t => t.length > 3);
        
        if (possibleTasks.length > 1) {
            // Multiple tasks detected
            return possibleTasks.map((taskText, index) => ({
                title: taskText.slice(0, 50) + (taskText.length > 50 ? '...' : ''),
                description: taskText,
                time: new Date(suggestedTime.getTime() + (index * 30 * 60 * 1000)).toTimeString().slice(0, 5),
                date: now.toISOString().split('T')[0],
                priority: 'medium' as const,
                category: this.inferCategory(taskText)
            }));
        } else {
            // Single task
            return [{
                title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
                description: input,
                time: suggestedTime.toTimeString().slice(0, 5),
                date: now.toISOString().split('T')[0],
                priority: 'medium' as const,
                category: this.inferCategory(input)
            }];
        }
    }

    /**
     * Get user profile for personality context
     */
    private async getUserProfile(userId: string): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('Profiles')
                .select('mommy_lvl, ai_personality, name')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('⚠️ TaskAI: Could not fetch user profile:', error);
            return null;
        }
    }

    /**
     * Build personality context for better AI responses
     */
    private buildPersonalityContext(profile: any): string {
        if (!profile) return '';
        
        const mommyLevel = profile.mommy_lvl || 0;
        const aiPersonality = profile.ai_personality || 0;
        
        let context = `User context: ${profile.name || 'User'}. `;
        
        // Add personality-based context
        if (mommyLevel <= 2) {
            context += 'User prefers gentle, supportive task suggestions. ';
        } else if (mommyLevel >= 7) {
            context += 'User prefers direct, no-nonsense task organization. ';
        }
        
        if (aiPersonality === 2) {
            context += 'Focus on professional, business-oriented task structuring. ';
        } else if (aiPersonality === 6) {
            context += 'Consider deeper meaning and long-term implications of tasks. ';
        }
        
        return context;
    }

    /**
     * Log interaction for learning and improvement
     */
    private async logInteraction(
        userId: string, 
        input: string, 
        aiResponse: string, 
        extractedTasks: ExtractedTask[]
    ): Promise<void> {
        try {
            const interactionId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await supabase
                .from('user_interactions')
                .insert({
                    id: interactionId,
                    user_id: userId,
                    message: input,
                    response: JSON.stringify(extractedTasks),
                    context_tags: ['task_extraction', 'voice_input'],
                    engagement_score: 3 // Default neutral score
                });
                
            console.log('📊 TaskAI: Logged interaction for learning');
        } catch (error) {
            console.warn('⚠️ TaskAI: Could not log interaction:', error);
        }
    }

    /**
     * Calculate confidence score for extraction quality
     */
    private calculateConfidence(tasks: ExtractedTask[], originalInput: string): number {
        let confidence = 0.5; // Base confidence
        
        // Boost confidence based on successful extraction indicators
        if (tasks.length > 0) confidence += 0.2;
        if (tasks.every(t => t.title.length > 5)) confidence += 0.1;
        if (tasks.some(t => t.time !== '12:00')) confidence += 0.1; // Non-default time
        if (tasks.some(t => t.date !== new Date().toISOString().split('T')[0])) confidence += 0.1; // Non-today date
        
        // Reduce confidence for very long or very short inputs
        const inputLength = originalInput.length;
        if (inputLength < 10 || inputLength > 500) confidence -= 0.2;
        
        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * Validation helpers
     */
    private validateTime(time: string): string | null {
        if (!time) return null;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time) ? time : null;
    }

    private validateDate(date: string): string | null {
        if (!date) return null;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return null;
        
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? null : date;
    }

    private validatePriority(priority: string): 'low' | 'medium' | 'high' {
        return ['low', 'medium', 'high'].includes(priority) ? priority as any : 'medium';
    }

    private validateCategory(category: string): string {
        const validCategories = [
            'work', 'personal', 'health', 'shopping', 'family', 
            'education', 'finance', 'travel', 'household', 'social'
        ];
        return validCategories.includes(category) ? category : 'personal';
    }

    private suggestTime(taskTitle: string): string {
        const title = taskTitle.toLowerCase();
        
        // Time suggestions based on task type
        if (title.includes('morning') || title.includes('breakfast')) return '09:00';
        if (title.includes('lunch')) return '12:30';
        if (title.includes('dinner') || title.includes('evening')) return '18:00';
        if (title.includes('night') || title.includes('bedtime')) return '21:00';
        if (title.includes('meeting') || title.includes('call')) return '14:00';
        if (title.includes('shopping') || title.includes('grocery')) return '15:00';
        if (title.includes('workout') || title.includes('gym')) return '17:00';
        if (title.includes('doctor') || title.includes('appointment')) return '10:00';
        
        // Default suggestion based on current time + 1 hour
        const now = new Date();
        const suggested = new Date(now.getTime() + 60 * 60 * 1000);
        return suggested.toTimeString().slice(0, 5);
    }

    private inferCategory(taskText: string): string {
        const text = taskText.toLowerCase();
        
        if (text.includes('meeting') || text.includes('work') || text.includes('project')) return 'work';
        if (text.includes('buy') || text.includes('shop') || text.includes('grocery')) return 'shopping';
        if (text.includes('doctor') || text.includes('health') || text.includes('gym')) return 'health';
        if (text.includes('family') || text.includes('mom') || text.includes('dad')) return 'family';
        if (text.includes('home') || text.includes('clean') || text.includes('fix')) return 'household';
        if (text.includes('friend') || text.includes('party') || text.includes('social')) return 'social';
        if (text.includes('study') || text.includes('learn') || text.includes('course')) return 'education';
        if (text.includes('bank') || text.includes('payment') || text.includes('bill')) return 'finance';
        if (text.includes('travel') || text.includes('trip') || text.includes('flight')) return 'travel';
        
        return 'personal';
    }
}

export default new TaskAIService();