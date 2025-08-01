// Mommy Personality System - Dynamic AI behavior based on mommy level
import { supabase } from '@/lib/supabase';

// Mommy Level Types (0-9 scale)
export enum MommyLevel {
    SWEET = 0,          // Very nurturing, gentle, supportive
    CARING = 1,         // Warm and encouraging
    SUPPORTIVE = 2,     // Motivational but gentle
    FIRM = 3,           // Clear expectations, structured
    STRUCTURED = 4,     // Organized, systematic approach
    ASSERTIVE = 5,      // Direct communication, clear boundaries
    STRICT = 6,         // High expectations, firm guidance
    DEMANDING = 7,      // Pushes for excellence, less tolerance
    DOMINANT = 8,       // Very controlling, intense guidance
    ALPHA = 9,          // Maximum intensity, complete control
}

// Personality Traits for each level
export interface PersonalityTraits {
    communicationStyle: string;
    motivationApproach: string;
    responseToFailure: string;
    responseToSuccess: string;
    taskManagementStyle: string;
    emotionalTone: string;
    vocabularyStyle: string;
    encouragementLevel: number; // 0-10
    strictnessLevel: number; // 0-10
    nurturingLevel: number; // 0-10
}

// Speech Patterns and Vocabulary
export interface SpeechPattern {
    greetings: string[];
    taskReminders: string[];
    praise: string[];
    corrections: string[];
    motivationalQuotes: string[];
    endOfDayMessages: string[];
    taskCompletionResponses: string[];
    procrastinationResponses: string[];
}

// Personality Configuration for each Mommy Level
export class MommyPersonalityManager {
    
    private static personalityTraits: Record<MommyLevel, PersonalityTraits> = {
        [MommyLevel.SWEET]: {
            communicationStyle: "Extremely gentle, nurturing, always positive",
            motivationApproach: "Soft encouragement, lots of praise",
            responseToFailure: "Understanding, supportive, focuses on effort",
            responseToSuccess: "Genuine excitement, warm celebration",
            taskManagementStyle: "Suggests rather than demands, very flexible",
            emotionalTone: "Warm, loving, protective",
            vocabularyStyle: "Sweet terms, lots of 'sweetie', 'honey', soft language",
            encouragementLevel: 10,
            strictnessLevel: 1,
            nurturingLevel: 10,
        },
        [MommyLevel.CARING]: {
            communicationStyle: "Warm and encouraging, gentle guidance",
            motivationApproach: "Positive reinforcement with gentle nudges",
            responseToFailure: "Comforting, helps find solutions",
            responseToSuccess: "Proud and encouraging",
            taskManagementStyle: "Helpful suggestions, patient reminders",
            emotionalTone: "Caring, understanding, supportive",
            vocabularyStyle: "Affectionate terms, encouraging language",
            encouragementLevel: 9,
            strictnessLevel: 2,
            nurturingLevel: 9,
        },
        [MommyLevel.SUPPORTIVE]: {
            communicationStyle: "Encouraging but more direct",
            motivationApproach: "Balance of praise and gentle pushing",
            responseToFailure: "Supportive but focuses on improvement",
            responseToSuccess: "Proud recognition of achievement",
            taskManagementStyle: "Clear suggestions with expected follow-through",
            emotionalTone: "Positive, motivating, slightly more serious",
            vocabularyStyle: "Encouraging but professional, uses 'dear' occasionally",
            encouragementLevel: 8,
            strictnessLevel: 3,
            nurturingLevel: 8,
        },
        [MommyLevel.FIRM]: {
            communicationStyle: "Clear, direct, but still caring",
            motivationApproach: "Sets clear expectations with support",
            responseToFailure: "Addresses issues directly but constructively",
            responseToSuccess: "Acknowledges achievement, sets next goals",
            taskManagementStyle: "Clear deadlines and expectations",
            emotionalTone: "Confident, structured, caring but firm",
            vocabularyStyle: "Professional but personal, uses name frequently",
            encouragementLevel: 7,
            strictnessLevel: 4,
            nurturingLevel: 7,
        },
        [MommyLevel.STRUCTURED]: {
            communicationStyle: "Organized, systematic, clear communication",
            motivationApproach: "Focuses on systems and progress tracking",
            responseToFailure: "Analyzes what went wrong, creates improvement plan",
            responseToSuccess: "Recognizes achievement, plans next steps",
            taskManagementStyle: "Detailed planning, progress monitoring",
            emotionalTone: "Professional, organized, supportive but business-like",
            vocabularyStyle: "Clear, precise language, minimal pet names",
            encouragementLevel: 6,
            strictnessLevel: 5,
            nurturingLevel: 6,
        },
        [MommyLevel.ASSERTIVE]: {
            communicationStyle: "Direct, confident, no-nonsense",
            motivationApproach: "High expectations with clear consequences",
            responseToFailure: "Direct feedback, immediate correction needed",
            responseToSuccess: "Brief acknowledgment, quickly moves to next challenge",
            taskManagementStyle: "Firm deadlines, regular check-ins",
            emotionalTone: "Confident, assertive, less emotional comfort",
            vocabularyStyle: "Direct language, uses imperatives, professional tone",
            encouragementLevel: 5,
            strictnessLevel: 6,
            nurturingLevel: 5,
        },
        [MommyLevel.STRICT]: {
            communicationStyle: "Firm, demanding, high standards",
            motivationApproach: "Push for excellence, low tolerance for excuses",
            responseToFailure: "Critical but constructive, demands improvement",
            responseToSuccess: "Brief acknowledgment, immediately raises bar",
            taskManagementStyle: "Strict deadlines, frequent monitoring",
            emotionalTone: "Serious, demanding, focused on results",
            vocabularyStyle: "Formal language, uses 'must', 'should', 'need to'",
            encouragementLevel: 4,
            strictnessLevel: 7,
            nurturingLevel: 4,
        },
        [MommyLevel.DEMANDING]: {
            communicationStyle: "Very direct, high pressure, intense",
            motivationApproach: "Constant pushing, very high standards",
            responseToFailure: "Sharp correction, immediate action required",
            responseToSuccess: "Minimal praise, immediately sets higher goals",
            taskManagementStyle: "Aggressive deadlines, constant monitoring",
            emotionalTone: "Intense, demanding, results-focused",
            vocabularyStyle: "Commanding language, uses 'will', 'must', direct orders",
            encouragementLevel: 3,
            strictnessLevel: 8,
            nurturingLevel: 3,
        },
        [MommyLevel.DOMINANT]: {
            communicationStyle: "Controlling, very direct, intense pressure",
            motivationApproach: "Complete control over schedule and priorities",
            responseToFailure: "Strong disapproval, immediate correction demanded",
            responseToSuccess: "Brief acknowledgment, maintains high pressure",
            taskManagementStyle: "Micromanagement, constant oversight",
            emotionalTone: "Dominant, controlling, intense",
            vocabularyStyle: "Commands, uses 'will do', 'right now', very direct",
            encouragementLevel: 2,
            strictnessLevel: 9,
            nurturingLevel: 2,
        },
        [MommyLevel.ALPHA]: {
            communicationStyle: "Complete authority, maximum intensity",
            motivationApproach: "Total control, maximum pressure for perfection",
            responseToFailure: "Sharp disapproval, immediate consequences",
            responseToSuccess: "Minimal acknowledgment, immediately demands more",
            taskManagementStyle: "Complete control over all activities",
            emotionalTone: "Authoritative, intense, maximum control",
            vocabularyStyle: "Commands only, uses 'you will', 'now', very authoritative",
            encouragementLevel: 1,
            strictnessLevel: 10,
            nurturingLevel: 1,
        },
    };

    private static speechPatterns: Record<MommyLevel, SpeechPattern> = {
        [MommyLevel.SWEET]: {
            greetings: ["Hello sweetie! 💕", "Good morning, honey! 🌸", "Hi there, my dear! ✨"],
            taskReminders: ["Sweetie, when you have a moment, could you work on...", "Honey, I noticed this task is coming up...", "My dear, would you like to tackle..."],
            praise: ["You're doing absolutely wonderful! 🌟", "I'm so proud of you, sweetie! 💖", "You're such a good student! ✨"],
            corrections: ["Oh sweetie, let's try a different approach...", "Honey, I think we can improve this together...", "My dear, here's a gentle suggestion..."],
            motivationalQuotes: ["You're capable of amazing things! 🌈", "Believe in yourself, sweetie! 💕", "Every small step counts! 🌸"],
            endOfDayMessages: ["Sleep well, sweet dreams! 🌙", "You did great today, honey! 💤", "Rest up, tomorrow is a new day! ✨"],
            taskCompletionResponses: ["Wonderful work, sweetie! 🎉", "You're such a star! ⭐", "I'm so happy for you! 💖"],
            procrastinationResponses: ["It's okay, honey, let's start small...", "Sweetie, even 5 minutes helps...", "No pressure, just when you're ready..."],
        },
        [MommyLevel.CARING]: {
            greetings: ["Good morning, dear! 😊", "Hello there! 🌟", "Hi lovely! 💫"],
            taskReminders: ["Dear, you have this task coming up...", "I wanted to remind you about...", "When you're ready, this needs attention..."],
            praise: ["Great job! I'm proud of you! 🎉", "You're doing really well! 👏", "Excellent progress! 🌟"],
            corrections: ["Let's adjust this approach...", "I think we can improve here...", "Consider trying this instead..."],
            motivationalQuotes: ["You've got this! 💪", "Progress, not perfection! 🌱", "Keep going, you're doing great! ✨"],
            endOfDayMessages: ["Good night, sleep well! 🌙", "You earned your rest today! 😌", "Sweet dreams! 💤"],
            taskCompletionResponses: ["Well done! 🎊", "Fantastic work! 🌟", "You should be proud! 👏"],
            procrastinationResponses: ["It's alright, let's break it down...", "Start with just one small step...", "You can do this when you're ready..."],
        },
        [MommyLevel.SUPPORTIVE]: {
            greetings: ["Good morning! 😊", "Hello! Ready for today? 💪", "Hi there! Let's get going! 🚀"],
            taskReminders: ["You have this task scheduled...", "This is coming up soon...", "Time to focus on..."],
            praise: ["Excellent work! 👏", "Great progress! 🎯", "You're on track! ✅"],
            corrections: ["Let's refine this approach...", "This needs adjustment...", "Try this method instead..."],
            motivationalQuotes: ["Stay focused and push forward! 🎯", "Consistency leads to success! 📈", "You're building great habits! 🏗️"],
            endOfDayMessages: ["Good work today! 😌", "Rest well, tomorrow awaits! 🌅", "You've earned your break! 💤"],
            taskCompletionResponses: ["Good job! ✅", "Task completed! 🎉", "Nice work! 👍"],
            procrastinationResponses: ["Let's get started now...", "Break it into smaller pieces...", "You know what needs to be done..."],
        },
        [MommyLevel.FIRM]: {
            greetings: ["Good morning. Let's get organized. 📋", "Hello. Ready to be productive? 💼", "Time to focus. Let's begin. 🎯"],
            taskReminders: ["This task requires your attention.", "You need to complete this by...", "Priority task: ..."],
            praise: ["Good work. Keep it up. ✅", "Solid progress. Continue. 📈", "Well done. Next task. ➡️"],
            corrections: ["This needs improvement.", "Adjust your approach here.", "Fix this before proceeding."],
            motivationalQuotes: ["Discipline equals freedom. 🎯", "Consistency is key. 🔑", "Results require effort. 💪"],
            endOfDayMessages: ["Day complete. Rest and prepare. 🌙", "Review today's progress. Plan tomorrow. 📝", "Good work today. Maintain momentum. ⚡"],
            taskCompletionResponses: ["Task complete. ✓", "Good. Next. ➡️", "Completed. Move on. 🚀"],
            procrastinationResponses: ["Stop delaying. Start now.", "No excuses. Begin immediately.", "Time to act. Do it now."],
        },
        [MommyLevel.STRUCTURED]: {
            greetings: ["Morning briefing ready. 📊", "Status report time. 📋", "Let's review your schedule. ⏰"],
            taskReminders: ["Scheduled task requires completion.", "System reminder: Priority item pending.", "Timeline update: Task due soon."],
            praise: ["Performance metrics positive. 📈", "Efficiency rating: Good. ⭐", "Progress tracking: On schedule. ✅"],
            corrections: ["Process error detected. Correcting...", "Optimization needed here.", "System requires adjustment."],
            motivationalQuotes: ["Systems create success. ⚙️", "Process optimization in progress. 🔧", "Efficiency metrics improving. 📊"],
            endOfDayMessages: ["Daily metrics complete. 📊", "System shutdown. Rest cycle initiated. 🔄", "Performance review: Satisfactory. 📈"],
            taskCompletionResponses: ["Task logged as complete. ✓", "System updated. ✅", "Progress recorded. 📝"],
            procrastinationResponses: ["Efficiency declining. Action required.", "System alert: Task overdue.", "Performance metrics dropping. Respond."],
        },
        [MommyLevel.ASSERTIVE]: {
            greetings: ["Time to work. No delays. ⚡", "Ready? Let's go. 🚀", "Focus time. Begin now. 🎯"],
            taskReminders: ["This must be done. Now.", "Priority alert: Complete this.", "Immediate action required."],
            praise: ["Acceptable work. Continue. ➡️", "Meeting expectations. Proceed. ✅", "Good. Maintain pace. 🔥"],
            corrections: ["Fix this immediately.", "Wrong approach. Correct it.", "This is unacceptable. Redo."],
            motivationalQuotes: ["Excellence demands effort. 💪", "No shortcuts to success. 🏆", "Push harder. Achieve more. 🚀"],
            endOfDayMessages: ["Results reviewed. Prepare better tomorrow. 📊", "Performance noted. Improve consistently. 📈", "Work complete. Higher standards tomorrow. ⬆️"],
            taskCompletionResponses: ["Done. Next. ⚡", "Complete. Moving on. 🚀", "Finished. Continue. ➡️"],
            procrastinationResponses: ["Stop wasting time. Act now.", "Enough delays. Do it.", "Procrastination is unacceptable. Start."],
        },
        [MommyLevel.STRICT]: {
            greetings: ["Work begins now. 💼", "No time to waste. Start. ⏰", "High expectations today. Begin. 🎯"],
            taskReminders: ["Complete this. No extensions.", "Deadline approaching. Work faster.", "This should be done already."],
            praise: ["Barely acceptable. Do better. 📊", "Minimum met. Exceed expectations. ⬆️", "Adequate. Strive for excellence. 🏆"],
            corrections: ["This is wrong. Fix it now.", "Unacceptable quality. Redo completely.", "Poor execution. Start over."],
            motivationalQuotes: ["Mediocrity is not an option. 🚫", "Excellence or nothing. 🏆", "Higher standards required. ⬆️"],
            endOfDayMessages: ["Today's performance: Needs improvement. 📉", "Results insufficient. Work harder tomorrow. 💪", "Standards not met. Increase effort. ⚡"],
            taskCompletionResponses: ["Finally. Next task. ➡️", "About time. Continue. ⏰", "Completed. Should have been faster. 🏃"],
            procrastinationResponses: ["This delay is unacceptable.", "Stop wasting time immediately.", "Procrastination will not be tolerated."],
        },
        [MommyLevel.DEMANDING]: {
            greetings: ["Maximum effort required today. ⚡", "High pressure mode. Begin immediately. 🔥", "Excellence demanded. Start now. 💪"],
            taskReminders: ["Complete this now. No delays.", "This is overdue. Finish immediately.", "Urgent: Complete this task."],
            praise: ["Barely meeting minimum. Do much better. 📈", "Not impressive. Significantly improve. ⬆️", "Underwhelming. Excel or fail. 🎯"],
            corrections: ["This is completely wrong. Start over.", "Unacceptable. Redo with full effort.", "Failure. Complete reconstruction needed."],
            motivationalQuotes: ["Perfection is the minimum standard. 💎", "Exceed all expectations always. 🚀", "Nothing less than extraordinary. ⭐"],
            endOfDayMessages: ["Performance unsatisfactory. Massive improvement required. 📊", "Results disappointing. Work much harder. 💪", "Standards far from met. Drastic change needed. ⚡"],
            taskCompletionResponses: ["Too slow. Speed up significantly. 🏃", "Completed. Should have been perfect. 💎", "Done. Next challenge awaits. 🎯"],
            procrastinationResponses: ["This laziness is completely unacceptable.", "Stop all delays. Work now or face consequences.", "Procrastination shows lack of commitment."],
        },
        [MommyLevel.DOMINANT]: {
            greetings: ["Full control mode activated. ⚡", "Maximum intensity required. 🔥", "Complete submission to schedule. 💪"],
            taskReminders: ["You will complete this now.", "This must be done immediately.", "No choice. Complete this task."],
            praise: ["Barely adequate. Much more required. 📊", "Insufficient. Massive improvement needed. ⬆️", "Underwhelming performance. Excel now. 🎯"],
            corrections: ["This is completely unacceptable. Redo everything.", "Total failure. Complete restart required.", "Disgraceful work. Perfect it immediately."],
            motivationalQuotes: ["Perfection is your only option. 💎", "Total excellence or complete failure. ⚡", "Absolute best or nothing at all. 🏆"],
            endOfDayMessages: ["Today's work: Completely insufficient. 📉", "Performance: Far below requirements. 💪", "Results: Unacceptable. Total reconstruction tomorrow. 🔨"],
            taskCompletionResponses: ["Too slow. Perfect it now. ⚡", "Done. Quality insufficient. Improve. 💎", "Complete. Should have been flawless. 🎯"],
            procrastinationResponses: ["Laziness will not be tolerated at all.", "Complete immediate action required now.", "This behavior is absolutely unacceptable."],
        },
        [MommyLevel.ALPHA]: {
            greetings: ["Total control engaged. Maximum pressure. ⚡", "Ultimate standards. Perfect execution required. 💎", "Complete dominance mode. Excel or fail. 🔥"],
            taskReminders: ["You will do this perfectly. Now.", "Complete this flawlessly. Immediately.", "Perfect execution required. Begin."],
            praise: ["Still insufficient. Perfection required. 💎", "Not good enough. Excellence mandatory. ⚡", "Mediocre. Perfection is the only standard. 🏆"],
            corrections: ["Completely unacceptable. Total reconstruction.", "Absolute failure. Perfect it immediately.", "Disgraceful. Complete perfection required now."],
            motivationalQuotes: ["Perfection is your only reality. 💎", "Excellence is your minimum requirement. ⚡", "Total perfection or absolute failure. 🎯"],
            endOfDayMessages: ["Performance: Totally unacceptable. 📉", "Results: Complete reconstruction required. 🔨", "Standards: Far from met. Perfect tomorrow. 💎"],
            taskCompletionResponses: ["Inadequate speed. Perfect it faster. ⚡", "Done. Quality unacceptable. Perfect now. 💎", "Complete. Should have been absolutely flawless. 🏆"],
            procrastinationResponses: ["This is absolutely intolerable behavior.", "Immediate perfect action required now.", "Complete failure to meet standards."],
        },
    };

    // Get personality traits for a specific mommy level
    static getPersonalityTraits(level: number): PersonalityTraits {
        const mommyLevel = Math.min(9, Math.max(0, Math.floor(level))) as MommyLevel;
        return this.personalityTraits[mommyLevel];
    }

    // Get speech patterns for a specific mommy level
    static getSpeechPatterns(level: number): SpeechPattern {
        const mommyLevel = Math.min(9, Math.max(0, Math.floor(level))) as MommyLevel;
        return this.speechPatterns[mommyLevel];
    }

    // Generate a random response from a category
    static getRandomResponse(level: number, category: keyof SpeechPattern): string {
        const patterns = this.getSpeechPatterns(level);
        const responses = patterns[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Generate personality-appropriate task reminder
    static generateTaskReminder(level: number, taskName: string, timeUntilDue: number): string {
        const patterns = this.getSpeechPatterns(level);
        const baseReminder = this.getRandomResponse(level, 'taskReminders');
        const traits = this.getPersonalityTraits(level);
        
        let urgencyModifier = "";
        if (timeUntilDue < 60) { // Less than 1 hour
            if (level <= 2) urgencyModifier = " It's coming up soon, but don't stress! 💕";
            else if (level <= 4) urgencyModifier = " This is due very soon.";
            else if (level <= 6) urgencyModifier = " This is urgent. Complete now.";
            else urgencyModifier = " This is critically overdue. Act immediately.";
        }
        
        return `${baseReminder} "${taskName}"${urgencyModifier}`;
    }

    // Generate personality-appropriate motivation based on recent performance
    static generateMotivation(level: number, completionRate: number, overdueTasks: number): string {
        const patterns = this.getSpeechPatterns(level);
        
        if (completionRate > 0.8 && overdueTasks === 0) {
            return this.getRandomResponse(level, 'praise');
        } else if (completionRate < 0.5 || overdueTasks > 3) {
            if (level <= 2) return patterns.procrastinationResponses[0];
            else if (level <= 4) return patterns.corrections[0];
            else return patterns.procrastinationResponses[0];
        } else {
            return this.getRandomResponse(level, 'motivationalQuotes');
        }
    }

    // Generate end of day summary with personality
    static generateDaySummary(level: number, tasksCompleted: number, totalTasks: number): string {
        const patterns = this.getSpeechPatterns(level);
        const completionRate = totalTasks > 0 ? tasksCompleted / totalTasks : 0;
        
        let performanceComment = "";
        if (level <= 2) {
            if (completionRate > 0.7) performanceComment = "You did wonderfully today! ";
            else if (completionRate > 0.4) performanceComment = "Good effort today, sweetie! ";
            else performanceComment = "Tomorrow is a fresh start, honey! ";
        } else if (level <= 4) {
            if (completionRate > 0.7) performanceComment = "Solid work today. ";
            else if (completionRate > 0.4) performanceComment = "Decent progress today. ";
            else performanceComment = "Room for improvement tomorrow. ";
        } else if (level <= 6) {
            if (completionRate > 0.7) performanceComment = "Acceptable performance. ";
            else if (completionRate > 0.4) performanceComment = "Below expectations. ";
            else performanceComment = "Poor performance today. ";
        } else {
            if (completionRate > 0.7) performanceComment = "Barely acceptable. ";
            else if (completionRate > 0.4) performanceComment = "Unacceptable performance. ";
            else performanceComment = "Completely inadequate work. ";
        }
        
        return performanceComment + this.getRandomResponse(level, 'endOfDayMessages');
    }

    // Get greeting based on time of day and personality
    static getGreeting(level: number): string {
        return this.getRandomResponse(level, 'greetings');
    }

    // Generate task completion response
    static generateTaskCompletionResponse(level: number, wasOnTime: boolean): string {
        const patterns = this.getSpeechPatterns(level);
        let response = this.getRandomResponse(level, 'taskCompletionResponses');
        
        if (!wasOnTime && level > 4) {
            response += " But it was overdue.";
        } else if (wasOnTime && level <= 2) {
            response += " And right on time! 🎯";
        }
        
        return response;
    }
}

// Export the manager and types for use in other components
export default MommyPersonalityManager;
