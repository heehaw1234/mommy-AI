import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";
import { useTaskContext } from "@/contexts/TaskContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from 'react-native-chart-kit';

type UserData = {
    id: string;
    name: string;
    mommy_lvl: number;
    ai_personality?: number;
    number: string;
};

type StudyStats = {
    xp: number;
    level: number;
    streak: number;
    totalTasks: number;
    completedTasks: number;
    studyHours: number;
    achievements: string[];
};

type FlashCard = {
    id: string;
    question: string;
    answer: string;
    category: string;
    lastReviewed: string;
    difficulty: 'easy' | 'medium' | 'hard';
    reviewCount: number;
};

type WeeklyPerformance = {
    day: string;
    count: number;
};

const achievementDefinitions = [
    { id: 'early_bird', name: 'Early Bird', description: 'Complete 5 tasks before 9 AM', icon: 'sunny' },
    { id: 'streak_master', name: 'Streak Master', description: 'Maintain 7-day study streak', icon: 'flame' },
    { id: 'task_warrior', name: 'Task Warrior', description: 'Complete 50 tasks', icon: 'shield' },
    { id: 'night_owl', name: 'Night Owl', description: 'Complete 10 tasks after 10 PM', icon: 'moon' },
    { id: 'perfectionist', name: 'Perfectionist', description: 'Complete all tasks for 3 days straight', icon: 'star' },
    { id: 'flash_master', name: 'Flash Master', description: 'Review 100 flashcards', icon: 'library' },
];

export default function Index() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [currentFlashCard, setCurrentFlashCard] = useState<FlashCard | null>(null);
    const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [studyStats, setStudyStats] = useState<StudyStats>({
        xp: 0,
        level: 1,
        streak: 0,
        totalTasks: 0,
        completedTasks: 0,
        studyHours: 0,
        achievements: []
    });
    const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPerformance[]>([]);
    const [achievements, setAchievements] = useState(achievementDefinitions.map(a => ({ ...a, unlocked: false })));
    
    const { session } = useAppContext();
    const { tasksList: tasks } = useTaskContext();

    // Calculate completion rate
    const completionRate = studyStats.totalTasks > 0 ? Math.round((studyStats.completedTasks / studyStats.totalTasks) * 100) : 0;

    // Calculate XP progress to next level
    const xpForNextLevel = (studyStats.level + 1) * 200;
    const xpProgress = (studyStats.xp % 200) / 200 * 100;

    // Real performance data for charts
    const performanceData = {
        labels: weeklyPerformance.map(d => d.day) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            data: weeklyPerformance.length > 0 ? weeklyPerformance.map(d => d.count) : [0, 0, 0, 0, 0, 0, 0],
            strokeWidth: 3,
        }]
    };

    const screenWidth = Dimensions.get('window').width;

    // Fetch real study stats from database
    const fetchStudyStats = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            // Calculate stats from tasks in TaskContext
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.completed).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Calculate XP based on completed tasks
            let totalXP = 0;
            tasks.filter(t => t.completed).forEach(task => {
                // Assume difficulty is stored in task description or default to medium
                const difficulty = task.description?.toLowerCase().includes('hard') ? 'hard' :
                                 task.description?.toLowerCase().includes('easy') ? 'easy' : 'medium';
                switch(difficulty) {
                    case 'easy': totalXP += 10; break;
                    case 'medium': totalXP += 20; break;
                    case 'hard': totalXP += 30; break;
                }
            });

            // Calculate level (every 200 XP = 1 level)
            const level = Math.max(1, Math.floor(totalXP / 200) + 1);

            // Calculate streak (simplified - consecutive days with completed tasks)
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const hasTasksOnDay = tasks.some(task => 
                    task.completed && task.date === dateStr
                );
                
                if (hasTasksOnDay) {
                    streak++;
                } else if (i > 0) {
                    break; // Break streak if no tasks found (but allow today to be empty)
                }
            }

            // Estimate study hours (assume 30 min per completed task)
            const studyHours = Math.round((completedTasks * 0.5) * 10) / 10;

            setStudyStats({
                xp: totalXP,
                level: level,
                streak: streak,
                totalTasks: totalTasks,
                completedTasks: completedTasks,
                studyHours: studyHours,
                achievements: [] // Will be populated by fetchAchievements
            });

        } catch (error) {
            console.error('Error fetching study stats:', error);
        }
    }, [session, tasks]);

    // Fetch weekly performance data
    const fetchWeeklyPerformance = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
            
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const performance: WeeklyPerformance[] = [];

            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dayStr = day.toISOString().split('T')[0];
                
                const completedCount = tasks.filter(task => 
                    task.completed && task.date === dayStr
                ).length;

                performance.push({
                    day: weekDays[i],
                    count: completedCount
                });
            }

            setWeeklyPerformance(performance);
        } catch (error) {
            console.error('Error fetching weekly performance:', error);
        }
    }, [session, tasks]);

    // Fetch achievements
    const fetchAchievements = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const completedTasks = tasks.filter(t => t.completed);
            const unlockedAchievements: string[] = [];

            // Check Early Bird (5 tasks before 9 AM)
            const earlyTasks = completedTasks.filter(task => {
                const taskTime = task.time.split(':');
                const hour = parseInt(taskTime[0]);
                return hour < 9;
            });
            if (earlyTasks.length >= 5) {
                unlockedAchievements.push('early_bird');
            }

            // Check Task Warrior (50 completed tasks)
            if (completedTasks.length >= 50) {
                unlockedAchievements.push('task_warrior');
            }

            // Check Streak Master (7+ day streak)
            if (studyStats.streak >= 7) {
                unlockedAchievements.push('streak_master');
            }

            // Check Night Owl (10 tasks after 10 PM)
            const nightTasks = completedTasks.filter(task => {
                const taskTime = task.time.split(':');
                const hour = parseInt(taskTime[0]);
                return hour >= 22;
            });
            if (nightTasks.length >= 10) {
                unlockedAchievements.push('night_owl');
            }

            // Check Perfectionist (complete all tasks for 3 consecutive days)
            let perfectDays = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const dayTasks = tasks.filter(task => task.date === dateStr);
                const completedDayTasks = dayTasks.filter(task => task.completed);
                
                if (dayTasks.length > 0 && dayTasks.length === completedDayTasks.length) {
                    perfectDays++;
                    if (perfectDays >= 3) {
                        unlockedAchievements.push('perfectionist');
                        break;
                    }
                } else if (dayTasks.length > 0) {
                    perfectDays = 0; // Reset if not all tasks completed
                }
            }

            // Check Flash Master (review 100 flashcards)
            // Get total review count from flashcards
            const totalReviews = flashCards.reduce((sum, card) => sum + (card.reviewCount || 0), 0);
            if (totalReviews >= 100) {
                unlockedAchievements.push('flash_master');
            }

            // Update achievements state
            setAchievements(prevAchievements => 
                prevAchievements.map(achievement => ({
                    ...achievement,
                    unlocked: unlockedAchievements.includes(achievement.id)
                }))
            );

        } catch (error) {
            console.error('Error fetching achievements:', error);
        }
    }, [session, tasks, studyStats.streak, flashCards]);

    // Fetch flashcards from database
    const fetchFlashCards = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const { data, error } = await supabase
                .from('flashcards')
                .select('*')
                .eq('user_id', session.user.id)
                .order('last_reviewed', { ascending: true, nullsFirst: true })
                .limit(10);

            if (error) throw error;
            
            if (data && data.length > 0) {
                setFlashCards(data);
                getRandomFlashCard(data);
            } else {
                // No flashcards found, create default ones
                await createDefaultFlashCards();
            }
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            // Fallback to default flashcards if database fails
            await createDefaultFlashCards();
        }
    }, [session]);

    // Create default flashcards for new users
    const createDefaultFlashCards = async () => {
        if (!session?.user?.id) return;

        const defaultCards = [
            // Programming
            { question: 'What is React Native?', answer: 'A framework for building mobile apps using React', category: 'Programming', difficulty: 'medium' },
            { question: 'What does API stand for?', answer: 'Application Programming Interface', category: 'Programming', difficulty: 'easy' },
            { question: 'What is a closure in JavaScript?', answer: 'A function that has access to variables in its outer scope even after the outer function returns', category: 'Programming', difficulty: 'hard' },
            
            // AI/ML
            { question: 'Define Machine Learning', answer: 'AI technique that enables computers to learn without explicit programming', category: 'AI/ML', difficulty: 'hard' },
            { question: 'What is supervised learning?', answer: 'Learning with labeled training data to predict outcomes', category: 'AI/ML', difficulty: 'medium' },
            
            // Web Development
            { question: 'What is HTTP?', answer: 'HyperText Transfer Protocol - communication protocol for web', category: 'Web Dev', difficulty: 'easy' },
            { question: 'What is REST?', answer: 'Representational State Transfer - architectural style for web services', category: 'Web Dev', difficulty: 'medium' },
            
            // Database
            { question: 'What is SQL?', answer: 'Structured Query Language for managing relational databases', category: 'Database', difficulty: 'easy' },
            { question: 'What is a primary key?', answer: 'A unique identifier for each record in a database table', category: 'Database', difficulty: 'easy' },
            
            // Computer Science
            { question: 'Explain Big O Notation', answer: 'Mathematical notation describing algorithm efficiency and time complexity', category: 'Computer Science', difficulty: 'hard' },
            { question: 'What is recursion?', answer: 'A function that calls itself to solve smaller instances of the same problem', category: 'Computer Science', difficulty: 'medium' },
            
            // Math
            { question: 'What is the Pythagorean theorem?', answer: 'a² + b² = c² for right triangles', category: 'Mathematics', difficulty: 'easy' },
            { question: 'What is a derivative?', answer: 'The rate of change of a function at a given point', category: 'Mathematics', difficulty: 'hard' },
            
            // General Knowledge
            { question: 'What is photosynthesis?', answer: 'Process where plants convert sunlight into energy using chlorophyll', category: 'Science', difficulty: 'medium' },
            { question: 'Who invented the World Wide Web?', answer: 'Tim Berners-Lee', category: 'Technology', difficulty: 'medium' }
        ];

        try {
            const { data, error } = await supabase
                .from('flashcards')
                .insert(
                    defaultCards.map(card => ({
                        user_id: session.user.id,
                        ...card
                    }))
                )
                .select();

            if (error) throw error;
            if (data && data.length > 0) {
                setFlashCards(data);
                getRandomFlashCard(data);
                console.log(`✅ Created ${data.length} default flashcards`);
            }
        } catch (error) {
            console.error('Error creating default flashcards:', error);
        }
    };

    const fetchUserData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const { data, error } = await supabase
                .from("Profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error) throw error;
            setUserData(data);
            console.log("🏠 Home refreshed user data:", data);
        } catch (error) {
            console.log("Error fetching userData:", error);
        }
    }, [session]);

    // Initialize random flashcard
    const getRandomFlashCard = (cardArray?: FlashCard[]) => {
        const cardsToUse = cardArray || flashCards;
        if (cardsToUse.length === 0) return;
        
        const randomCard = cardsToUse[Math.floor(Math.random() * cardsToUse.length)];
        setCurrentFlashCard(randomCard);
        setShowAnswer(false);
    };

    // Handle flashcard answer reveal
    const handleFlashCardFlip = () => {
        setShowAnswer(!showAnswer);
    };

    // Quick study action handlers
    const startPomodoroTimer = () => {
        // Simple alert for now - you could integrate a proper timer
        Alert.alert('🍅 Focus Time', '25-minute Pomodoro timer started! Focus time begins now.');
        // You could add actual timer logic here or navigate to a timer screen
    };

    const reviewAllFlashCards = () => {
        if (flashCards.length === 0) {
            Alert.alert('📚 No Cards', 'No flashcards available. Create some flashcards first!');
            return;
        }
        // Reset to first card and show answer
        setCurrentFlashCard(flashCards[0]);
        setShowAnswer(false);
        Alert.alert('📖 Review Mode', 'Flashcard review mode activated! Swipe through all your cards.');
    };

    const addStudyGoal = () => {
        // Simple goal setting - you could make this more sophisticated
        Alert.alert('🎯 Goal Setting', 'Goal setting coming soon! For now, try completing all your daily tasks.');
        // You could navigate to a goal-setting screen or show a modal
    };

    // Get next flashcard for review mode
    const getNextFlashCard = () => {
        if (flashCards.length === 0) return;
        
        const currentIndex = flashCards.findIndex(card => card.id === currentFlashCard?.id);
        const nextIndex = (currentIndex + 1) % flashCards.length;
        setCurrentFlashCard(flashCards[nextIndex]);
        setShowAnswer(false);
    };

    // Mark flashcard as reviewed and get next one
    const markAsReviewed = async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!currentFlashCard || !session?.user?.id) return;

        try {
            // Update flashcard in database
            const { error } = await supabase
                .from('flashcards')
                .update({
                    last_reviewed: new Date().toISOString(),
                    review_count: (currentFlashCard.reviewCount || 0) + 1
                })
                .eq('id', currentFlashCard.id);

            if (error) throw error;

            // Update local flashcard data
            setFlashCards(prev => prev.map(card => 
                card.id === currentFlashCard.id 
                    ? { ...card, reviewCount: (card.reviewCount || 0) + 1, lastReviewed: new Date().toISOString() }
                    : card
            ));

            // Calculate XP gain
            let xpGain = 0;
            switch(difficulty) {
                case 'easy': xpGain = 5; break;
                case 'medium': xpGain = 10; break;
                case 'hard': xpGain = 15; break;
            }
            
            setStudyStats(prev => ({
                ...prev,
                xp: prev.xp + xpGain
            }));
            
            // Get next random flashcard
            getRandomFlashCard();
        } catch (error) {
            console.error('Error marking flashcard as reviewed:', error);
            // Still allow getting next card even if update fails
            getRandomFlashCard();
        }
    };

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUserData();
            fetchStudyStats();
            fetchWeeklyPerformance();
            fetchFlashCards();
        }, [fetchUserData, fetchStudyStats, fetchWeeklyPerformance, fetchFlashCards])
    );

    // Also refresh on initial mount and when tasks change
    useEffect(() => {
        fetchUserData();
        fetchStudyStats();
        fetchWeeklyPerformance();
        fetchFlashCards();
    }, [fetchUserData, fetchStudyStats, fetchWeeklyPerformance, fetchFlashCards]);

    // Update achievements when study stats change
    useEffect(() => {
        if (studyStats.totalTasks > 0) {
            fetchAchievements();
        }
    }, [fetchAchievements, studyStats.totalTasks]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Ionicons name="school" size={32} color="#fff" />
                        <Text style={styles.headerTitle}>Study Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Level up your learning! 🚀</Text>
                    </View>
                </View>

                {/* XP and Level Progress */}
                <View style={styles.xpCard}>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>LVL {studyStats.level}</Text>
                    </View>
                    <Text style={styles.xpText}>{studyStats.xp} XP</Text>
                    <View style={styles.xpBar}>
                        <View style={[styles.xpProgress, { width: `${xpProgress}%` }]} />
                    </View>
                    <Text style={styles.xpLabel}>{Math.round(xpProgress)}% to Level {studyStats.level + 1}</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="flame" size={24} color="#f97316" />
                        <Text style={styles.statNumber}>{studyStats.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                        <Text style={styles.statNumber}>{completionRate}%</Text>
                        <Text style={styles.statLabel}>Completion</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color="#6366f1" />
                        <Text style={styles.statNumber}>{studyStats.studyHours}h</Text>
                        <Text style={styles.statLabel}>Study Time</Text>
                    </View>
                </View>

                {/* Performance Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="trending-up" size={24} color="#6366f1" />
                        <Text style={styles.cardTitle}>Weekly Performance</Text>
                    </View>
                    <LineChart
                        data={performanceData}
                        width={screenWidth - 60}
                        height={180}
                        chartConfig={{
                            backgroundColor: '#fff',
                            backgroundGradientFrom: '#fff',
                            backgroundGradientTo: '#fff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                            strokeWidth: 3,
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: "#6366f1"
                            }
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* Daily Flashcard */}
                <View style={styles.flashCardContainer}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="library" size={24} color="#6366f1" />
                        <Text style={styles.cardTitle}>Daily Flashcard Review</Text>
                    </View>
                    
                    {currentFlashCard ? (
                        <View style={styles.flashCard}>
                            <View style={styles.flashCardCategory}>
                                <Text style={styles.categoryText}>{currentFlashCard.category}</Text>
                                <View style={[styles.difficultyBadge, { 
                                    backgroundColor: currentFlashCard.difficulty === 'easy' ? '#22c55e' : 
                                                   currentFlashCard.difficulty === 'medium' ? '#eab308' : '#ef4444' 
                                }]}>
                                    <Text style={styles.difficultyText}>{currentFlashCard.difficulty.toUpperCase()}</Text>
                                </View>
                            </View>
                            
                            <TouchableOpacity style={styles.flashCardContent} onPress={handleFlashCardFlip}>
                                <Text style={styles.flashCardLabel}>{showAnswer ? 'Answer:' : 'Question:'}</Text>
                                <Text style={styles.flashCardText}>
                                    {showAnswer ? currentFlashCard.answer : currentFlashCard.question}
                                </Text>
                                <Text style={styles.tapHint}>
                                    {showAnswer ? 'Rate your understanding below' : 'Tap to reveal answer'}
                                </Text>
                            </TouchableOpacity>
                            
                            {showAnswer && (
                                <View style={styles.flashCardButtons}>
                                    <TouchableOpacity 
                                        style={[styles.difficultyButton, styles.easyButton]}
                                        onPress={() => markAsReviewed('easy')}
                                    >
                                        <Text style={styles.buttonText}>Easy (+5 XP)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.difficultyButton, styles.mediumButton]}
                                        onPress={() => markAsReviewed('medium')}
                                    >
                                        <Text style={styles.buttonText}>Medium (+10 XP)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.difficultyButton, styles.hardButton]}
                                        onPress={() => markAsReviewed('hard')}
                                    >
                                        <Text style={styles.buttonText}>Hard (+15 XP)</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.noFlashCardContainer}>
                            <Ionicons name="book-outline" size={48} color="#9ca3af" />
                            <Text style={styles.noFlashCardText}>No flashcards available</Text>
                            <Text style={styles.noFlashCardSubtext}>Flashcards are being created for you...</Text>
                            <TouchableOpacity 
                                style={styles.retryButton} 
                                onPress={() => fetchFlashCards()}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Achievements */}
                <View style={styles.achievementsCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="trophy" size={24} color="#f59e0b" />
                        <Text style={styles.cardTitle}>Achievements</Text>
                    </View>
                    
                    <View style={styles.achievementsGrid}>
                        {achievements.slice(0, 6).map((achievement) => (
                            <View key={achievement.id} style={[
                                styles.achievementBadge,
                                { opacity: achievement.unlocked ? 1 : 0.3 }
                            ]}>
                                <Ionicons 
                                    name={achievement.icon as any} 
                                    size={24} 
                                    color={achievement.unlocked ? "#f59e0b" : "#9ca3af"} 
                                />
                                <Text style={[
                                    styles.achievementName,
                                    { color: achievement.unlocked ? "#1f2937" : "#9ca3af" }
                                ]}>
                                    {achievement.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Study Actions */}
                <View style={styles.quickActionsCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flash" size={24} color="#6366f1" />
                        <Text style={styles.cardTitle}>Quick Study</Text>
                    </View>
                    
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={startPomodoroTimer}>
                            <Ionicons name="timer" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>25min Focus</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={reviewAllFlashCards}>
                            <Ionicons name="refresh" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Review Cards</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={addStudyGoal}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Add Goal</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        backgroundColor: "#6366f1",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingTop: 20,
        paddingBottom: 32,
        paddingHorizontal: 24,
        marginBottom: 24,
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    headerContent: {
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 12,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: "#c7d2fe",
    },
    xpCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    levelBadge: {
        backgroundColor: "#6366f1",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    levelText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    xpText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 12,
    },
    xpBar: {
        width: "100%",
        height: 8,
        backgroundColor: "#e5e7eb",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    xpProgress: {
        height: "100%",
        backgroundColor: "#6366f1",
        borderRadius: 4,
    },
    xpLabel: {
        fontSize: 14,
        color: "#6b7280",
    },
    statsGrid: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#6b7280",
        textAlign: "center",
    },
    chartCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
        marginLeft: 12,
    },
    chart: {
        borderRadius: 12,
    },
    flashCardContainer: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    flashCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: "#e5e7eb",
    },
    flashCardCategory: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6366f1",
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#fff",
    },
    flashCardContent: {
        alignItems: "center",
        paddingVertical: 20,
    },
    flashCardLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6b7280",
        marginBottom: 8,
    },
    flashCardText: {
        fontSize: 16,
        color: "#1f2937",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 12,
    },
    tapHint: {
        fontSize: 12,
        color: "#9ca3af",
        fontStyle: "italic",
    },
    flashCardButtons: {
        flexDirection: "row",
        marginTop: 16,
        gap: 8,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    easyButton: {
        backgroundColor: "#22c55e",
    },
    mediumButton: {
        backgroundColor: "#eab308",
    },
    hardButton: {
        backgroundColor: "#ef4444",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
    achievementsCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    achievementsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    achievementBadge: {
        width: "30%",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    achievementName: {
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 4,
    },
    quickActionsCard: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    quickActions: {
        flexDirection: "row",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: "#6366f1",
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
        marginLeft: 6,
    },
    noFlashCardContainer: {
        alignItems: "center",
        padding: 40,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    noFlashCardText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6b7280",
        marginTop: 12,
        marginBottom: 4,
    },
    noFlashCardSubtext: {
        fontSize: 14,
        color: "#9ca3af",
        textAlign: "center",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#6366f1",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
});
