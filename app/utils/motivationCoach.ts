// Motivation Coach - Dynamic personality adaptation based on student behavior
import { supabase } from '@/lib/supabase';

// Learning Style Types
export enum LearningStyle {
    VISUAL = 'visual',           // Prefers charts, diagrams, visual aids
    AUDITORY = 'auditory',       // Prefers voice, discussions, audio
    KINESTHETIC = 'kinesthetic', // Prefers hands-on, active learning
    READING = 'reading',         // Prefers text, written instructions
}

// Stress Level Indicators
export enum StressLevel {
    LOW = 0,      // Calm, organized, completing tasks early
    MODERATE = 1, // Some pressure but manageable
    HIGH = 2,     // Overwhelmed, missing deadlines
    CRITICAL = 3, // Crisis mode, needs immediate support
}

// Learning Patterns
export interface LearningPattern {
    preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    averageTaskDuration: number; // in minutes
    procrastinationTendency: number; // 0-1 scale
    completionRate: number; // 0-1 scale
    lastActiveHours: number[]; // array of hours when most active
}

// Student Profile for Dynamic Coaching
export interface StudentProfile {
    userId: string;
    stressLevel: StressLevel;
    learningStyle: LearningStyle;
    learningPattern: LearningPattern;
    currentMotivationLevel: number; // 0-10 scale
    lastUpdated: Date;
    // Academic context
    currentCourseLoad: number;
    examPeriod: boolean;
    semesterWeek: number; // 1-16 typical semester
}

// Behavioral Analytics
export class BehaviorAnalyzer {
    
    // Analyze stress level based on recent activity
    static analyzeStressLevel(tasks: any[], recentDays: number = 7): StressLevel {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (recentDays * 24 * 60 * 60 * 1000));
        
        const recentTasks = tasks.filter(task => 
            new Date(task.created_at) >= cutoffDate
        );
        
        if (recentTasks.length === 0) return StressLevel.LOW;
        
        // Calculate stress indicators
        const overdueTasks = recentTasks.filter(task => {
            const dueDate = new Date(task.due_at);
            return !task.completed && dueDate < now;
        }).length;
        
        const completionRate = recentTasks.filter(t => t.completed).length / recentTasks.length;
        const avgTasksPerDay = recentTasks.length / recentDays;
        const urgentTasks = recentTasks.filter(task => {
            const dueDate = new Date(task.due_at);
            const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursUntilDue < 24 && !task.completed;
        }).length;
        
        // Stress calculation algorithm
        let stressScore = 0;
        
        // Overdue tasks (high impact)
        stressScore += overdueTasks * 2;
        
        // Low completion rate
        if (completionRate < 0.6) stressScore += 2;
        if (completionRate < 0.3) stressScore += 3;
        
        // High task volume
        if (avgTasksPerDay > 5) stressScore += 2;
        if (avgTasksPerDay > 8) stressScore += 3;
        
        // Urgent tasks
        stressScore += urgentTasks * 1.5;
        
        // Map score to stress level
        if (stressScore >= 8) return StressLevel.CRITICAL;
        if (stressScore >= 5) return StressLevel.HIGH;
        if (stressScore >= 2) return StressLevel.MODERATE;
        return StressLevel.LOW;
    }
    
    // Detect learning style based on user interactions
    static detectLearningStyle(userBehavior: {
        voiceTasksCreated: number;
        textTasksCreated: number;
        taskCompletionTimes: number[]; // hours of day
        averageTaskDescriptionLength: number;
        aiInteractionFrequency: number;
    }): LearningStyle {
        const {
            voiceTasksCreated,
            textTasksCreated,
            taskCompletionTimes,
            averageTaskDescriptionLength,
            aiInteractionFrequency
        } = userBehavior;
        
        const totalTasks = voiceTasksCreated + textTasksCreated;
        if (totalTasks === 0) return LearningStyle.VISUAL; // default
        
        const voicePreference = voiceTasksCreated / totalTasks;
        const detailedDescriptions = averageTaskDescriptionLength > 100;
        const highAIInteraction = aiInteractionFrequency > 0.7;
        
        // Analysis logic
        if (voicePreference > 0.6 && highAIInteraction) {
            return LearningStyle.AUDITORY;
        }
        
        if (detailedDescriptions && voicePreference < 0.3) {
            return LearningStyle.READING;
        }
        
        if (!detailedDescriptions && taskCompletionTimes.length > 0) {
            // Quick, action-oriented tasks suggest kinesthetic
            const avgCompletionHours = taskCompletionTimes.reduce((a, b) => a + b, 0) / taskCompletionTimes.length;
            if (avgCompletionHours >= 9 && avgCompletionHours <= 17) { // Active day hours
                return LearningStyle.KINESTHETIC;
            }
        }
        
        return LearningStyle.VISUAL; // default fallback
    }
    
    // Analyze learning patterns
    static analyzeLearningPattern(tasks: any[], interactions: any[]): LearningPattern {
        const now = new Date();
        const recentTasks = tasks.filter(task => {
            const taskDate = new Date(task.created_at);
            const daysAgo = (now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 30; // Last 30 days
        });
        
        if (recentTasks.length === 0) {
            return {
                preferredTimeOfDay: 'morning',
                averageTaskDuration: 60,
                procrastinationTendency: 0.5,
                completionRate: 0.8,
                lastActiveHours: [9, 10, 11, 14, 15, 16]
            };
        }
        
        // Analyze completion times to find preferred time of day
        const completionHours = recentTasks
            .filter(t => t.completed)
            .map(t => new Date(t.updated_at || t.created_at).getHours());
        
        const hourCounts = new Array(24).fill(0);
        completionHours.forEach(hour => hourCounts[hour]++);
        
        const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
        let preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
        
        if (mostActiveHour >= 6 && mostActiveHour < 12) preferredTimeOfDay = 'morning';
        else if (mostActiveHour >= 12 && mostActiveHour < 17) preferredTimeOfDay = 'afternoon';
        else if (mostActiveHour >= 17 && mostActiveHour < 22) preferredTimeOfDay = 'evening';
        else preferredTimeOfDay = 'night';
        
        // Calculate procrastination tendency
        const procrastinationScores = recentTasks.map(task => {
            const created = new Date(task.created_at);
            const due = new Date(task.due_at);
            const completed = task.completed ? new Date(task.updated_at) : due;
            
            const totalTime = due.getTime() - created.getTime();
            const timeUsed = completed.getTime() - created.getTime();
            
            return Math.min(timeUsed / totalTime, 1); // Ratio of time used
        });
        
        const avgProcrastination = procrastinationScores.length > 0 
            ? procrastinationScores.reduce((a, b) => a + b, 0) / procrastinationScores.length 
            : 0.5;
        
        return {
            preferredTimeOfDay,
            averageTaskDuration: 60, // This would need actual duration tracking
            procrastinationTendency: Math.min(avgProcrastination, 1),
            completionRate: recentTasks.filter(t => t.completed).length / recentTasks.length,
            lastActiveHours: hourCounts.map((count, hour) => ({ hour, count }))
                .filter(item => item.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map(item => item.hour)
        };
    }
}

// Dynamic Motivation Coach
export class MotivationCoach {
    
    // Get current student profile
    static async getStudentProfile(userId: string): Promise<StudentProfile | null> {
        try {
            const { data, error } = await supabase
                .from('StudentProfiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') { // Not found error
                console.error('Error fetching student profile:', error);
                return null;
            }
            
            return data ? {
                userId: data.user_id,
                stressLevel: data.stress_level,
                learningStyle: data.learning_style,
                learningPattern: JSON.parse(data.learning_pattern),
                currentMotivationLevel: data.motivation_level,
                lastUpdated: new Date(data.updated_at),
                currentCourseLoad: data.course_load || 4,
                examPeriod: data.exam_period || false,
                semesterWeek: data.semester_week || 8
            } : null;
        } catch (error) {
            console.error('Error in getStudentProfile:', error);
            return null;
        }
    }
    
    // Update student profile based on recent behavior
    static async updateStudentProfile(userId: string): Promise<StudentProfile | null> {
        try {
            // Fetch recent tasks and interactions
            const [tasksResult, interactionsResult] = await Promise.all([
                supabase.from('Tasks').select('*').eq('user_id', userId),
                supabase.from('Profiles').select('*').eq('id', userId).single()
            ]);
            
            if (tasksResult.error || interactionsResult.error) {
                console.error('Error fetching data for profile update');
                return null;
            }
            
            const tasks = tasksResult.data || [];
            const profile = interactionsResult.data;
            
            // Analyze current state
            const stressLevel = BehaviorAnalyzer.analyzeStressLevel(tasks);
            const learningPattern = BehaviorAnalyzer.analyzeLearningPattern(tasks, []);
            
            // Detect learning style (simplified for now)
            const voiceTasksCount = tasks.filter(t => 
                t.description && t.description.includes('voice')
            ).length;
            const learningStyle = BehaviorAnalyzer.detectLearningStyle({
                voiceTasksCreated: voiceTasksCount,
                textTasksCreated: tasks.length - voiceTasksCount,
                taskCompletionTimes: tasks.map(t => new Date(t.due_at).getHours()),
                averageTaskDescriptionLength: 50,
                aiInteractionFrequency: 0.8
            });
            
            // Calculate motivation level
            const motivationLevel = this.calculateMotivationLevel(stressLevel, learningPattern);
            
            const studentProfile: Partial<StudentProfile> = {
                userId,
                stressLevel,
                learningStyle,
                learningPattern,
                currentMotivationLevel: motivationLevel,
                lastUpdated: new Date(),
                currentCourseLoad: 4,
                examPeriod: false,
                semesterWeek: 8
            };
            
            // Upsert to database
            const { data, error } = await supabase
                .from('StudentProfiles')
                .upsert({
                    user_id: userId,
                    stress_level: stressLevel,
                    learning_style: learningStyle,
                    learning_pattern: JSON.stringify(learningPattern),
                    motivation_level: motivationLevel,
                    updated_at: new Date().toISOString(),
                    course_load: 4,
                    exam_period: false,
                    semester_week: 8
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error updating student profile:', error);
                return null;
            }
            
            return studentProfile as StudentProfile;
        } catch (error) {
            console.error('Error in updateStudentProfile:', error);
            return null;
        }
    }
    
    // Calculate motivation level based on stress and patterns
    private static calculateMotivationLevel(stressLevel: StressLevel, pattern: LearningPattern): number {
        let baseMotivation = 5; // Start at neutral
        
        // Adjust based on stress level
        switch (stressLevel) {
            case StressLevel.LOW:
                baseMotivation += 2;
                break;
            case StressLevel.MODERATE:
                baseMotivation += 0;
                break;
            case StressLevel.HIGH:
                baseMotivation -= 2;
                break;
            case StressLevel.CRITICAL:
                baseMotivation -= 3;
                break;
        }
        
        // Adjust based on completion rate
        baseMotivation += (pattern.completionRate - 0.5) * 4; // -2 to +2 adjustment
        
        // Adjust based on procrastination
        baseMotivation -= pattern.procrastinationTendency * 2;
        
        return Math.max(0, Math.min(10, Math.round(baseMotivation)));
    }
    
    // Get adaptive AI personality settings
    static getAdaptivePersonality(profile: StudentProfile): { mommyLevel: number; personalityType: number } {
        let mommyLevel = 2; // Start with caring
        let personalityType = 0; // Start with friendly
        
        // Adjust based on stress level
        switch (profile.stressLevel) {
            case StressLevel.LOW:
                mommyLevel = Math.max(0, mommyLevel - 1); // More gentle
                personalityType = 0; // Friendly
                break;
            case StressLevel.MODERATE:
                mommyLevel = 3; // Helpful
                personalityType = 1; // Smart
                break;
            case StressLevel.HIGH:
                mommyLevel = 5; // Stern
                personalityType = 7; // Motivational
                break;
            case StressLevel.CRITICAL:
                mommyLevel = 4; // Firm but supportive
                personalityType = 7; // Motivational
                break;
        }
        
        // Adjust based on learning style
        switch (profile.learningStyle) {
            case LearningStyle.AUDITORY:
                personalityType = 3; // Funny - more engaging verbally
                break;
            case LearningStyle.VISUAL:
                personalityType = 1; // Smart - structured responses
                break;
            case LearningStyle.KINESTHETIC:
                personalityType = 7; // Motivational - action-oriented
                break;
            case LearningStyle.READING:
                personalityType = 2; // Professional - detailed responses
                break;
        }
        
        // Adjust based on motivation level
        if (profile.currentMotivationLevel < 3) {
            mommyLevel = Math.min(6, mommyLevel + 2); // More supportive
            personalityType = 7; // Motivational
        } else if (profile.currentMotivationLevel > 7) {
            mommyLevel = Math.max(0, mommyLevel - 1); // Less intense
            personalityType = 0; // Friendly
        }
        
        // Time-based adjustments
        const currentHour = new Date().getHours();
        if (currentHour < 6 || currentHour > 22) {
            mommyLevel = Math.max(0, mommyLevel - 1); // Gentler at night
        }
        
        return {
            mommyLevel: Math.max(0, Math.min(9, mommyLevel)),
            personalityType: Math.max(0, Math.min(9, personalityType))
        };
    }
    
    // Get contextual motivational message
    static getMotivationalMessage(profile: StudentProfile): string {
        const messages = {
            [StressLevel.LOW]: {
                [LearningStyle.VISUAL]: "🌟 You're doing great! Keep that momentum going with your organized approach!",
                [LearningStyle.AUDITORY]: "🎵 Love your rhythm! Keep listening to your instincts and staying on track!",
                [LearningStyle.KINESTHETIC]: "⚡ Your active approach is paying off! Keep moving forward!",
                [LearningStyle.READING]: "📚 Your thorough preparation shows! Keep building on that solid foundation!"
            },
            [StressLevel.MODERATE]: {
                [LearningStyle.VISUAL]: "📊 I can see you're managing well. Let's organize priorities to stay ahead!",
                [LearningStyle.AUDITORY]: "🗣️ Talk through your challenges - you've got this! Break it down step by step.",
                [LearningStyle.KINESTHETIC]: "🎯 Time for action! Let's tackle one task at a time to build momentum.",
                [LearningStyle.READING]: "✍️ Your analytical skills will help here. Write down your priorities and attack them systematically."
            },
            [StressLevel.HIGH]: {
                [LearningStyle.VISUAL]: "🚨 Let's create a clear visual plan to get you back on track. You can do this!",
                [LearningStyle.AUDITORY]: "💪 Listen up! You're stronger than this stress. Let's talk through solutions together.",
                [LearningStyle.KINESTHETIC]: "🔥 Channel that energy into action! Start with the smallest task to build confidence.",
                [LearningStyle.READING]: "📝 Write down everything overwhelming you, then we'll tackle it piece by piece. Knowledge is power!"
            },
            [StressLevel.CRITICAL]: {
                [LearningStyle.VISUAL]: "🆘 Emergency mode activated! Let's create a simple, visual rescue plan. One step at a time.",
                [LearningStyle.AUDITORY]: "🚨 I'm here with you! Let's talk through immediate priorities. You're not alone in this.",
                [LearningStyle.KINESTHETIC]: "⚡ Crisis = opportunity for action! Let's move fast on the most urgent item right now.",
                [LearningStyle.READING]: "📚 Time for strategic thinking. List the absolute must-dos and we'll execute with precision."
            }
        };
        
        return messages[profile.stressLevel][profile.learningStyle];
    }
}
