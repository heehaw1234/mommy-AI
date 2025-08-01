// Enhanced AI Response System - Integrates mommy personality with task management
import { MommyPersonalityManager, MommyLevel } from './mommyPersonality';
import { supabase } from '@/lib/supabase';

// Context for AI responses
export interface TaskContext {
    taskName: string;
    timeUntilDue: number; // in minutes
    isOverdue: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    completionRate: number; // 0-1 for user's overall performance
    overdueTasks: number;
}

// Response types
export enum ResponseType {
    GREETING = 'greeting',
    TASK_REMINDER = 'task_reminder',
    TASK_COMPLETION = 'task_completion',
    MOTIVATION = 'motivation',
    CORRECTION = 'correction',
    DAY_SUMMARY = 'day_summary',
    PROCRASTINATION_HELP = 'procrastination_help',
    STRESS_SUPPORT = 'stress_support'
}

export class EnhancedAIResponseSystem {
    
    // Generate contextual AI response based on mommy level and situation
    static async generateResponse(
        userId: string,
        responseType: ResponseType,
        context?: TaskContext
    ): Promise<string> {
        // Get user's mommy level
        const mommyLevel = await this.getUserMommyLevel(userId);
        
        switch (responseType) {
            case ResponseType.GREETING:
                return this.generateGreeting(mommyLevel);
                
            case ResponseType.TASK_REMINDER:
                if (!context) throw new Error('Task context required for task reminders');
                return this.generateTaskReminder(mommyLevel, context);
                
            case ResponseType.TASK_COMPLETION:
                if (!context) throw new Error('Task context required for completion response');
                return this.generateTaskCompletionResponse(mommyLevel, context);
                
            case ResponseType.MOTIVATION:
                if (!context) throw new Error('Context required for motivation');
                return this.generateMotivationalMessage(mommyLevel, context);
                
            case ResponseType.CORRECTION:
                if (!context) throw new Error('Context required for correction');
                return this.generateCorrectionMessage(mommyLevel, context);
                
            case ResponseType.DAY_SUMMARY:
                if (!context) throw new Error('Context required for day summary');
                return this.generateDaySummary(mommyLevel, context);
                
            case ResponseType.PROCRASTINATION_HELP:
                if (!context) throw new Error('Context required for procrastination help');
                return this.generateProcrastinationHelp(mommyLevel, context);
                
            case ResponseType.STRESS_SUPPORT:
                if (!context) throw new Error('Context required for stress support');
                return this.generateStressSupport(mommyLevel, context);
                
            default:
                return MommyPersonalityManager.getGreeting(mommyLevel);
        }
    }

    // Get user's mommy level from database
    private static async getUserMommyLevel(userId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from("Profiles")
                .select("mommy_lvl")
                .eq("id", userId)
                .single();
            
            if (error) {
                console.error('Error fetching mommy level:', error);
                return 0; // Default to sweet mommy level
            }
            
            return data?.mommy_lvl || 0;
        } catch (error) {
            console.error('Exception fetching mommy level:', error);
            return 0;
        }
    }

    // Generate personalized greeting
    private static generateGreeting(mommyLevel: number): string {
        const hour = new Date().getHours();
        let timeGreeting = "";
        
        if (hour < 12) timeGreeting = "morning";
        else if (hour < 17) timeGreeting = "afternoon";
        else timeGreeting = "evening";
        
        const baseGreeting = MommyPersonalityManager.getGreeting(mommyLevel);
        
        // Add time-specific context based on personality
        if (mommyLevel <= 2) {
            return `Good ${timeGreeting}! ${baseGreeting} I hope you're feeling wonderful today! 💖`;
        } else if (mommyLevel <= 4) {
            return `Good ${timeGreeting}! ${baseGreeting} Ready to tackle your goals? 🎯`;
        } else if (mommyLevel <= 6) {
            return `Good ${timeGreeting}. ${baseGreeting} Time to be productive. 💼`;
        } else {
            return `${timeGreeting.charAt(0).toUpperCase() + timeGreeting.slice(1)}. ${baseGreeting} Maximum effort required. ⚡`;
        }
    }

    // Generate task reminder with context
    private static generateTaskReminder(mommyLevel: number, context: TaskContext): string {
        const baseReminder = MommyPersonalityManager.generateTaskReminder(
            mommyLevel, 
            context.taskName, 
            context.timeUntilDue
        );
        
        // Add difficulty-based encouragement/pressure
        let difficultyComment = "";
        if (context.difficulty === 'hard') {
            if (mommyLevel <= 2) difficultyComment = " I know this one is challenging, but I believe in you! 💪";
            else if (mommyLevel <= 4) difficultyComment = " This is a challenging task. Take your time and focus. 🎯";
            else if (mommyLevel <= 6) difficultyComment = " Difficult task. Apply maximum concentration.";
            else difficultyComment = " High difficulty. Perfect execution required.";
        }
        
        return baseReminder + difficultyComment;
    }

    // Generate task completion response
    private static generateTaskCompletionResponse(mommyLevel: number, context: TaskContext): string {
        const wasOnTime = !context.isOverdue;
        let baseResponse = MommyPersonalityManager.generateTaskCompletionResponse(mommyLevel, wasOnTime);
        
        // Add performance-based follow-up
        if (context.completionRate > 0.8) {
            if (mommyLevel <= 2) baseResponse += " You're on such a great streak! Keep it up! 🌟";
            else if (mommyLevel <= 4) baseResponse += " Excellent consistency. Maintain this momentum. ✅";
            else if (mommyLevel <= 6) baseResponse += " Good performance pattern. Continue.";
            else baseResponse += " Acceptable pattern. Maintain or improve.";
        }
        
        return baseResponse;
    }

    // Generate motivational message based on performance
    private static generateMotivationalMessage(mommyLevel: number, context: TaskContext): string {
        const motivation = MommyPersonalityManager.generateMotivation(
            mommyLevel, 
            context.completionRate, 
            context.overdueTasks
        );
        
        // Add specific encouragement based on current situation
        if (context.overdueTasks > 0) {
            if (mommyLevel <= 2) {
                return motivation + " Don't worry about what's behind, focus on moving forward! 🌈";
            } else if (mommyLevel <= 4) {
                return motivation + " Let's prioritize and catch up systematically. 📋";
            } else if (mommyLevel <= 6) {
                return motivation + " Overdue tasks require immediate attention.";
            } else {
                return motivation + " Overdue tasks are unacceptable. Complete immediately.";
            }
        }
        
        return motivation;
    }

    // Generate correction message
    private static generateCorrectionMessage(mommyLevel: number, context: TaskContext): string {
        const patterns = MommyPersonalityManager.getSpeechPatterns(mommyLevel);
        const baseCorrection = patterns.corrections[Math.floor(Math.random() * patterns.corrections.length)];
        
        // Add specific guidance based on the issue
        let guidance = "";
        if (context.isOverdue) {
            if (mommyLevel <= 2) guidance = " Let's break this down into smaller, manageable pieces. 🧩";
            else if (mommyLevel <= 4) guidance = " Create a focused plan to complete this efficiently.";
            else if (mommyLevel <= 6) guidance = " Implement time management strategies immediately.";
            else guidance = " Time management failure. Implement strict schedule control.";
        }
        
        return baseCorrection + guidance;
    }

    // Generate day summary
    private static generateDaySummary(mommyLevel: number, context: TaskContext): string {
        const tasksCompleted = Math.floor(context.completionRate * 10); // Assuming out of 10 tasks
        const totalTasks = 10;
        
        return MommyPersonalityManager.generateDaySummary(mommyLevel, tasksCompleted, totalTasks);
    }

    // Generate procrastination help
    private static generateProcrastinationHelp(mommyLevel: number, context: TaskContext): string {
        const patterns = MommyPersonalityManager.getSpeechPatterns(mommyLevel);
        const baseResponse = patterns.procrastinationResponses[0];
        
        // Add level-appropriate strategies
        let strategy = "";
        if (mommyLevel <= 2) {
            strategy = " Maybe try the 2-minute rule? If it takes less than 2 minutes, do it now! ✨";
        } else if (mommyLevel <= 4) {
            strategy = " Try the Pomodoro technique: 25 minutes focused work, then a 5-minute break. 🍅";
        } else if (mommyLevel <= 6) {
            strategy = " Set a timer for 15 minutes and work with full focus. No distractions.";
        } else {
            strategy = " Eliminate all distractions. Work until completion. No breaks.";
        }
        
        return baseResponse + strategy;
    }

    // Generate stress support
    private static generateStressSupport(mommyLevel: number, context: TaskContext): string {
        if (mommyLevel <= 2) {
            return "I can see you're feeling overwhelmed, sweetie. 💕 Take a deep breath. We can handle this together, one step at a time. You're stronger than you know! 🌸";
        } else if (mommyLevel <= 4) {
            return "Feeling stressed? That's normal. Let's prioritize your tasks and tackle them systematically. You've got this! 💪";
        } else if (mommyLevel <= 6) {
            return "Stress indicates poor planning. Reorganize your priorities and execute efficiently. Focus on solutions.";
        } else {
            return "Stress is weakness. Control your emotions and execute your tasks perfectly. No excuses.";
        }
    }

    // Generate context-aware notification message
    static generateNotificationMessage(
        mommyLevel: number, 
        taskName: string, 
        minutesUntilDue: number
    ): string {
        if (minutesUntilDue <= 0) {
            // Overdue
            if (mommyLevel <= 2) return `Sweetie, "${taskName}" is overdue, but don't stress! Let's get it done! 💕`;
            else if (mommyLevel <= 4) return `"${taskName}" is past due. Please complete it when you can. ⏰`;
            else if (mommyLevel <= 6) return `"${taskName}" is overdue. Complete immediately.`;
            else return `"${taskName}" is overdue. This is unacceptable. Complete now.`;
        } else if (minutesUntilDue <= 30) {
            // Very urgent
            if (mommyLevel <= 2) return `Gentle reminder: "${taskName}" is due very soon! You can do it! 🌟`;
            else if (mommyLevel <= 4) return `Urgent: "${taskName}" is due in ${minutesUntilDue} minutes. 🚨`;
            else if (mommyLevel <= 6) return `Critical: "${taskName}" must be completed in ${minutesUntilDue} minutes.`;
            else return `Emergency: "${taskName}" must be perfect in ${minutesUntilDue} minutes.`;
        } else if (minutesUntilDue <= 120) {
            // Upcoming
            if (mommyLevel <= 2) return `Just a heads up: "${taskName}" is coming up in ${Math.floor(minutesUntilDue/60)} hours! 😊`;
            else if (mommyLevel <= 4) return `Reminder: "${taskName}" is due in ${Math.floor(minutesUntilDue/60)} hours. 📅`;
            else if (mommyLevel <= 6) return `Schedule alert: "${taskName}" due in ${Math.floor(minutesUntilDue/60)} hours.`;
            else return `Time management: "${taskName}" requires completion in ${Math.floor(minutesUntilDue/60)} hours.`;
        } else {
            // Advance notice
            if (mommyLevel <= 2) return `Early reminder: "${taskName}" is coming up later today! 🌸`;
            else if (mommyLevel <= 4) return `Advance notice: "${taskName}" is scheduled for later. 📋`;
            else if (mommyLevel <= 6) return `Planning reminder: "${taskName}" requires attention today.`;
            else return `Efficiency notice: "${taskName}" must be scheduled and executed today.`;
        }
    }
}

export default EnhancedAIResponseSystem;
