// Mommy AI Response Component - Displays personality-based responses
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EnhancedAIResponseSystem, { ResponseType, TaskContext } from '../utils/enhancedAI';
import { useAppContext } from '@/contexts/AppContext';

interface MommyAIResponseProps {
    responseType: ResponseType;
    context?: TaskContext;
    onDismiss?: () => void;
    autoShow?: boolean;
    style?: any;
}

export const MommyAIResponse: React.FC<MommyAIResponseProps> = ({
    responseType,
    context,
    onDismiss,
    autoShow = true,
    style
}) => {
    const { session } = useAppContext();
    const [response, setResponse] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [mommyLevel, setMommyLevel] = useState(0);

    useEffect(() => {
        if (session?.user?.id && autoShow) {
            generateResponse();
        }
    }, [session?.user?.id, responseType, context, autoShow]);

    const generateResponse = async () => {
        if (!session?.user?.id) return;

        try {
            const aiResponse = await EnhancedAIResponseSystem.generateResponse(
                session.user.id,
                responseType,
                context
            );
            setResponse(aiResponse);
            if (autoShow) {
                showResponse();
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            setResponse('Hello! Ready to be productive today? 💪');
            if (autoShow) {
                showResponse();
            }
        }
    };

    const showResponse = () => {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const hideResponse = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
            onDismiss?.();
        });
    };

    const getPersonalityColor = (): string => {
        if (mommyLevel <= 2) return '#10b981'; // Green - Sweet/Caring
        else if (mommyLevel <= 4) return '#3b82f6'; // Blue - Supportive/Firm
        else if (mommyLevel <= 6) return '#f59e0b'; // Orange - Structured/Assertive
        else return '#ef4444'; // Red - Strict/Demanding/Alpha
    };

    const getPersonalityIcon = (): string => {
        if (mommyLevel <= 2) return 'heart';
        else if (mommyLevel <= 4) return 'happy';
        else if (mommyLevel <= 6) return 'business';
        else return 'flash';
    };

    const getPersonalityTitle = (): string => {
        if (mommyLevel <= 1) return 'Sweet Mommy AI 💕';
        else if (mommyLevel <= 2) return 'Caring Mommy AI 😊';
        else if (mommyLevel <= 3) return 'Supportive AI 🤝';
        else if (mommyLevel <= 4) return 'Firm AI 💪';
        else if (mommyLevel <= 5) return 'Structured AI 📋';
        else if (mommyLevel <= 6) return 'Assertive AI ⚡';
        else if (mommyLevel <= 7) return 'Strict AI 🎯';
        else if (mommyLevel <= 8) return 'Demanding AI 🔥';
        else return 'Alpha AI 👑';
    };

    if (!isVisible || !response) return null;

    return (
        <Animated.View 
            style={[
                styles.overlayContainer, 
                { 
                    opacity: fadeAnim,
                    borderLeftColor: getPersonalityColor()
                },
                style
            ]}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getPersonalityColor() }]}>
                    <Ionicons 
                        name={getPersonalityIcon() as any} 
                        size={18} 
                        color="#fff" 
                    />
                </View>
                <Text style={styles.titleText}>{getPersonalityTitle()}</Text>
                <TouchableOpacity 
                    onPress={hideResponse}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={18} color="#666" />
                </TouchableOpacity>
            </View>
            
            <Text style={styles.responseText}>{response}</Text>
            
            {responseType === ResponseType.TASK_REMINDER && context && (
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: getPersonalityColor() }]}
                        onPress={() => {
                            // Could trigger task completion or navigation
                            hideResponse();
                        }}
                    >
                        <Text style={styles.actionButtonText}>
                            {mommyLevel <= 2 ? "Thanks! 💕" : mommyLevel <= 4 ? "Got it! 👍" : mommyLevel <= 6 ? "Understood ✅" : "Acknowledged 💯"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};

// Hook for easier usage
export const useMommyAI = () => {
    const { session } = useAppContext();
    
    const showResponse = async (
        responseType: ResponseType, 
        context?: TaskContext
    ): Promise<string> => {
        if (!session?.user?.id) return 'Please log in to access Mommy AI! 😊';
        
        try {
            return await EnhancedAIResponseSystem.generateResponse(
                session.user.id,
                responseType,
                context
            );
        } catch (error) {
            console.error('Error generating AI response:', error);
            return 'Something went wrong, but you can do this! 💪';
        }
    };

    const getNotificationMessage = async (
        taskName: string,
        minutesUntilDue: number
    ): Promise<string> => {
        if (!session?.user?.id) return `Reminder: ${taskName} is due soon!`;
        
        try {
            // Get user's mommy level first
            const { data } = await import('@/lib/supabase').then(module => 
                module.supabase
                    .from("Profiles")
                    .select("mommy_lvl")
                    .eq("id", session.user.id)
                    .single()
            );
            
            const mommyLevel = data?.mommy_lvl || 0;
            return EnhancedAIResponseSystem.generateNotificationMessage(
                mommyLevel,
                taskName,
                minutesUntilDue
            );
        } catch (error) {
            console.error('Error generating notification:', error);
            return `Reminder: ${taskName} is due soon!`;
        }
    };

    return {
        showResponse,
        getNotificationMessage,
    };
};

const styles = StyleSheet.create({
    overlayContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        margin: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderLeftWidth: 4,
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    titleText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    responseText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#444',
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default MommyAIResponse;
