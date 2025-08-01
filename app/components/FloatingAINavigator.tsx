import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MommyAIResponse, useMommyAI } from './MommyAIResponse';
import { ResponseType, TaskContext } from '../utils/enhancedAI';
import { saveFloatingAIPosition, loadFloatingAIPosition, getDefaultPosition } from '../utils/floatingAIStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;
const EXPANDED_SIZE = 280;

interface FloatingAINavigatorProps {
    mommyLevel: number;
    tasks?: any[];
    onAIResponse?: (type: ResponseType, context?: TaskContext) => void;
}

export const FloatingAINavigator: React.FC<FloatingAINavigatorProps> = ({
    mommyLevel,
    tasks = [],
    onAIResponse
}) => {
    const router = useRouter();
    const { showResponse } = useMommyAI();
    
    // Animation and position states
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAIResponse, setShowAIResponse] = useState(false);
    const [aiResponseType, setAiResponseType] = useState<ResponseType>(ResponseType.GREETING);
    const [aiContext, setAiContext] = useState<TaskContext | undefined>();
    const [currentPosition, setCurrentPosition] = useState(getDefaultPosition());
    
    // Position animations - use only JS-driven animations to avoid mixing
    const panAnim = useRef(new Animated.ValueXY(getDefaultPosition())).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Load saved position on mount
    useEffect(() => {
        const loadPosition = async () => {
            const savedPosition = await loadFloatingAIPosition();
            if (savedPosition) {
                setCurrentPosition(savedPosition);
                panAnim.setValue(savedPosition);
            }
        };
        loadPosition();
    }, []);

    // Pan responder for dragging
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only respond to pan if not expanded and significant movement
                return !isExpanded && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
            },
            onPanResponderGrant: () => {
                // Store initial position for drag calculation
                panAnim.extractOffset();
                
                Animated.spring(scaleAnim, {
                    toValue: 0.9,
                    useNativeDriver: false,
                }).start();
            },
            onPanResponderMove: (evt, gestureState) => {
                if (!isExpanded) {
                    // Calculate new position during drag
                    const newX = currentPosition.x + gestureState.dx;
                    const newY = currentPosition.y + gestureState.dy;
                    
                    // Apply bounds during drag
                    const minX = 10;
                    const maxX = SCREEN_WIDTH - BUTTON_SIZE - 10;
                    const minY = 60;
                    const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 100;
                    
                    const boundedX = Math.max(minX, Math.min(maxX, newX));
                    const boundedY = Math.max(minY, Math.min(maxY, newY));
                    
                    panAnim.setValue({ x: boundedX, y: boundedY });
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                // Calculate final position
                const newX = currentPosition.x + gestureState.dx;
                const newY = currentPosition.y + gestureState.dy;
                
                // Constrain to screen bounds
                const minX = 10;
                const maxX = SCREEN_WIDTH - BUTTON_SIZE - 10;
                const minY = 60;
                const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 100;
                
                let finalX = Math.max(minX, Math.min(maxX, newX));
                let finalY = Math.max(minY, Math.min(maxY, newY));
                
                // Snap to left or right edge
                if (finalX < SCREEN_WIDTH / 2) {
                    finalX = minX;
                } else {
                    finalX = maxX;
                }
                
                // Update position state
                setCurrentPosition({ x: finalX, y: finalY });
                
                // Save position to storage
                saveFloatingAIPosition({ x: finalX, y: finalY });
                
                // Animate to final position
                Animated.parallel([
                    Animated.spring(panAnim, {
                        toValue: { x: finalX, y: finalY },
                        useNativeDriver: false,
                        tension: 100,
                        friction: 8,
                    }),
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        useNativeDriver: false,
                    }),
                ]).start();
            },
        })
    ).current;

    // Get personality-based styling
    const getPersonalityColor = () => {
        if (mommyLevel <= 2) return '#10b981'; // Green - Sweet
        if (mommyLevel <= 4) return '#3b82f6'; // Blue - Caring
        if (mommyLevel <= 6) return '#f59e0b'; // Orange - Firm
        return '#ef4444'; // Red - Alpha
    };

    const getPersonalityIcon = () => {
        if (mommyLevel <= 2) return 'heart';
        if (mommyLevel <= 4) return 'happy';
        if (mommyLevel <= 6) return 'business';
        return 'flash';
    };

    // Handle expansion toggle
    const toggleExpanded = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue: newExpanded ? 1 : 0,
                useNativeDriver: false,
                tension: 100,
                friction: 8,
            }),
            Animated.timing(rotateAnim, {
                toValue: newExpanded ? 1 : 0,
                duration: 300,
                useNativeDriver: false, // Use JS driver for consistency
            }),
        ]).start();
    };

    // Handle AI chat
    const handleAIChat = () => {
        const now = new Date();
        const upcomingTasks = tasks.filter(t => {
            const tDateTime = new Date(`${t.date}T${t.time}`);
            return tDateTime.getTime() > now.getTime() && !t.completed;
        });
        
        if (upcomingTasks.length > 0) {
            const nextTask = upcomingTasks[0];
            const timeUntilDue = (new Date(`${nextTask.date}T${nextTask.time}`).getTime() - now.getTime()) / (1000 * 60);
            
            const context: TaskContext = {
                taskName: nextTask.text,
                timeUntilDue: timeUntilDue,
                isOverdue: false,
                difficulty: nextTask.text.length > 30 ? 'hard' : 'medium',
                category: 'general',
                completionRate: tasks.filter(t => t.completed).length / tasks.length,
                overdueTasks: tasks.filter(t => {
                    const tDateTime = new Date(`${t.date}T${t.time}`);
                    return tDateTime.getTime() < now.getTime() && !t.completed;
                }).length
            };
            
            setAiContext(context);
            setAiResponseType(ResponseType.MOTIVATION);
        } else {
            setAiResponseType(ResponseType.GREETING);
        }
        
        setShowAIResponse(true);
        setIsExpanded(false);
        
        // Animate back to collapsed state
        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue: 0,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false, // Use JS driver for consistency
            }),
        ]).start();
    };

    // Navigation handlers
    const navigateToPage = (page: string) => {
        setIsExpanded(false);
        
        // Animate back to collapsed state
        Animated.parallel([
            Animated.spring(expandAnim, {
                toValue: 0,
                useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start(() => {
            // Navigate after animation completes
            try {
                console.log('🎯 Navigating to:', page);
                
                // Use proper router navigation
                switch (page) {
                    case '/(tabs)/home':
                        router.replace('/(tabs)/home');
                        break;
                    case '/(tabs)/chatbot':
                        router.replace('/(tabs)/chatbot');
                        break;
                    case '/(tabs)/voice':
                        router.replace('/(tabs)/voice');
                        break;
                    case '/(tabs)/second':
                        router.replace('/(tabs)/second');
                        break;
                    case '/(tabs)/third':
                        router.replace('/(tabs)/third');
                        break;
                    case '/(tabs)/profile':
                        router.replace('/(tabs)/profile');
                        break;
                    default:
                        console.warn('Unknown route:', page);
                        router.replace('/(tabs)/home');
                }
            } catch (error) {
                console.error('❌ Navigation error:', error);
                // Fallback to home page
                router.replace('/(tabs)/home');
            }
        });
    };

    // Calculate rotation
    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    // Calculate expanded container opacity
    const containerOpacity = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <>
            {/* Mommy AI Response */}
            {showAIResponse && (
                <MommyAIResponse
                    responseType={aiResponseType}
                    context={aiContext}
                    onDismiss={() => setShowAIResponse(false)}
                    autoShow={true}
                />
            )}

            {/* Main floating container */}
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [
                            { translateX: panAnim.x },
                            { translateY: panAnim.y },
                            { scale: scaleAnim },
                        ],
                    },
                ]}
                {...(isExpanded ? {} : panResponder.panHandlers)}
            >
                {/* Expanded content */}
                <View 
                    style={[
                        styles.expandedContent,
                        {
                            opacity: isExpanded ? 1 : 0,
                            backgroundColor: getPersonalityColor(),
                            transform: [{ scale: isExpanded ? 1 : 0.8 }],
                        }
                    ]}
                    pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                    <Text style={styles.expandedTitle}>Quick Nav</Text>
                    
                    {/* Navigation buttons */}
                    <View style={styles.navButtonsContainer}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigateToPage('/(tabs)/chatbot')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                        <Text style={styles.navButtonText}>Chat</Text>
                    </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateToPage('/(tabs)/voice')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="mic" size={20} color="#fff" />
                            <Text style={styles.navButtonText}>Voice</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateToPage('/(tabs)/second')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="list" size={20} color="#fff" />
                            <Text style={styles.navButtonText}>Tasks</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateToPage('/(tabs)/third')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar" size={20} color="#fff" />
                            <Text style={styles.navButtonText}>Calendar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigateToPage('/(tabs)/home')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="home" size={20} color="#fff" />
                            <Text style={styles.navButtonText}>Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={handleAIChat}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={getPersonalityIcon() as any} size={20} color="#fff" />
                            <Text style={styles.navButtonText}>AI Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main button */}
                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        {
                            backgroundColor: getPersonalityColor(),
                        }
                    ]}
                    onPress={toggleExpanded}
                    activeOpacity={0.8}
                >
                    <Animated.View
                        style={{
                            transform: [{ rotate: rotation }],
                        }}
                    >
                        <Ionicons 
                            name={isExpanded ? "close" : getPersonalityIcon() as any}
                            size={28} 
                            color="#fff" 
                        />
                    </Animated.View>
                    
                    {/* Animated pulse ring */}
                    <Animated.View 
                        style={[
                            styles.pulseRing,
                            {
                                borderColor: getPersonalityColor(),
                                opacity: isExpanded ? 0 : 0.3,
                            }
                        ]} 
                    />
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1000,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        elevation: 1000, // Ensure it stays on top on Android
    },
    expandedContent: {
        position: 'absolute',
        width: EXPANDED_SIZE,
        height: 200,
        borderRadius: 20,
        padding: 16,
        top: -70, // Position above the button
        left: -EXPANDED_SIZE + BUTTON_SIZE, // Align right edge with button
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    expandedTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    navButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    navButton: {
        width: '47%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    mainButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 1001,
    },
    pulseRing: {
        position: 'absolute',
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        borderWidth: 2,
        transform: [{ scale: 1.2 }],
    },
});

export default FloatingAINavigator;
