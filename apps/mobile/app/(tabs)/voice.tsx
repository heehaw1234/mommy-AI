import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    StyleSheet,
    Platform,
    TextInput,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskContext } from '@/contexts/TaskContext';
import { useAppContext } from '@/contexts/AppContext';
import ultraSimpleAI from '@/app/utils/ultraSimpleAI';
import taskAIService from '@/app/utils/taskAIService';

// Web Speech API types for TypeScript
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface VoiceRecognition {
    start: () => void;
    stop: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
}

export default function VoicePage() {
    const { addTaskToState, isLoading } = useTaskContext();
    const { session } = useAppContext();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [recognition, setRecognition] = useState<VoiceRecognition | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
    const [showTextInput, setShowTextInput] = useState(Platform.OS !== 'web');

    // Initialize speech recognition
    useEffect(() => {
        if (Platform.OS === 'web') {
            initializeWebSpeechRecognition();
        } else {
            // For mobile, we'll use text input as the primary method
            console.log('Using text input for mobile platform');
            setShowTextInput(true);
        }
    }, []);

    const initializeWebSpeechRecognition = () => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript(finalTranscript || interimTranscript);
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                Alert.alert('Speech Recognition Error', event.error);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
            setPermissionGranted(true);
            setShowTextInput(false); // Hide text input on web if speech works
        } else {
            console.log('Speech recognition not supported, showing text input');
            setShowTextInput(true);
        }
    };

    const startListening = async () => {
        if (Platform.OS === 'web' && recognition) {
            try {
                setTranscript('');
                setIsListening(true);
                recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                setIsListening(false);
                Alert.alert('Error', 'Failed to start speech recognition');
            }
        } else {
            // For mobile, focus on text input
            setShowTextInput(true);
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
        }
        setIsListening(false);
    };

    const handleTextSubmit = () => {
        if (textInput.trim()) {
            setTranscript(textInput.trim());
            setTextInput('');
        }
    };

    const processWithAI = async () => {
        const inputText = transcript.trim();
        if (!inputText) {
            Alert.alert('No Input Detected', 'Please speak something or type your tasks first.');
            return;
        }

        setIsProcessing(true);
        setGeneratedTasks([]);

        try {
            console.log('🎤 Processing input with enhanced AI service:', inputText);
            
            // Use the enhanced AI service for better task extraction
            const extractionResult = await taskAIService.extractTasksFromInput(
                inputText,
                session?.user?.id,
                {
                    currentTime: new Date(),
                    userPreferences: null, // Could be expanded with user preferences
                    existingTasks: [] // Could include existing tasks for context
                }
            );

            console.log('🤖 AI Extraction Result:', extractionResult);
            
            const { tasks, confidence } = extractionResult;

            // Show confidence level to user if low
            if (confidence < 0.5) {
                console.log('⚠️ Low confidence extraction, may need user review');
            }

            setGeneratedTasks(tasks.map(task => 
                `${task.title} - ${task.date} at ${task.time} (${task.category})`
            ));

            // Create the tasks in the database
            let successCount = 0;
            for (const taskData of tasks) {
                const task = {
                    text: taskData.title,
                    description: taskData.description,
                    time: taskData.time,
                    date: taskData.date,
                    completed: false
                };

                console.log('➕ Creating task:', task);
                const createdTask = await addTaskToState(task);
                if (createdTask) {
                    successCount++;
                    console.log('✅ Task created successfully:', createdTask);
                } else {
                    console.error('❌ Failed to create task:', task);
                }
            }

            const confidenceText = confidence > 0.7 ? 'with high confidence' : 
                                  confidence > 0.4 ? 'with good confidence' : 
                                  'with basic interpretation';

            if (successCount > 0) {
                Alert.alert(
                    'Tasks Created! 🎉', 
                    `Successfully created ${successCount} out of ${tasks.length} task(s) ${confidenceText}.\n\nProcessing time: ${extractionResult.processingTime}ms`,
                    [{ 
                        text: 'Great!', 
                        onPress: () => {
                            setTranscript('');
                            setGeneratedTasks([]);
                        }
                    }]
                );
            } else {
                Alert.alert('Error', 'Failed to create any tasks. Please try again.');
            }

        } catch (error) {
            console.error('Error processing input:', error);
            Alert.alert('Processing Error', 'Failed to process your input. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const clearAll = () => {
        setTranscript('');
        setTextInput('');
        setGeneratedTasks([]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎤 Voice to Tasks</Text>
                <Text style={styles.headerSubtitle}>
                    {Platform.OS === 'web' 
                        ? 'Speak or type your tasks and let AI organize them'
                        : 'Describe your tasks and let AI organize them'
                    }
                </Text>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Voice Recording Section (Web only) */}
                    {Platform.OS === 'web' && !showTextInput && (
                        <View style={styles.recordingSection}>
                            <View style={styles.recordingContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.recordButton,
                                        isListening ? styles.recordButtonActive : {}
                                    ]}
                                    onPress={isListening ? stopListening : startListening}
                                    disabled={isProcessing || isLoading}
                                >
                                    <Ionicons 
                                        name={isListening ? "stop" : "mic"} 
                                        size={40} 
                                        color="#fff" 
                                    />
                                </TouchableOpacity>
                                
                                <Text style={styles.recordingStatus}>
                                    {isListening ? '🔴 Listening...' : '🎤 Tap to start speaking'}
                                </Text>
                                
                                {isListening && (
                                    <View style={styles.soundWaves}>
                                        <View style={[styles.wave, styles.wave1]} />
                                        <View style={[styles.wave, styles.wave2]} />
                                        <View style={[styles.wave, styles.wave3]} />
                                    </View>
                                )}
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.switchModeButton}
                                onPress={() => setShowTextInput(true)}
                            >
                                <Ionicons name="create-outline" size={20} color="#2563eb" />
                                <Text style={styles.switchModeText}>Switch to typing</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Text Input Section */}
                    {showTextInput && (
                        <View style={styles.textInputSection}>
                            <Text style={styles.sectionTitle}>📝 Describe Your Tasks</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type what you want to do... e.g., 'Buy groceries tomorrow at 3pm and call mom tonight'"
                                value={textInput}
                                onChangeText={setTextInput}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                            />
                            <View style={styles.textInputButtons}>
                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleTextSubmit}
                                    disabled={!textInput.trim() || isProcessing}
                                >
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Use This Text</Text>
                                </TouchableOpacity>
                                
                                {Platform.OS === 'web' && recognition && (
                                    <TouchableOpacity 
                                        style={styles.switchModeButton}
                                        onPress={() => setShowTextInput(false)}
                                    >
                                        <Ionicons name="mic-outline" size={20} color="#2563eb" />
                                        <Text style={styles.switchModeText}>Switch to voice</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Transcript/Result Section */}
                    {transcript ? (
                        <View style={styles.transcriptSection}>
                            <View style={styles.transcriptHeader}>
                                <Text style={styles.transcriptTitle}>📋 Your Input</Text>
                                <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.transcriptContainer}>
                                <Text style={styles.transcriptText}>{transcript}</Text>
                            </View>

                            {/* Process Button */}
                            <TouchableOpacity
                                style={[
                                    styles.processButton,
                                    (isProcessing || isLoading) ? styles.processButtonDisabled : {}
                                ]}
                                onPress={processWithAI}
                                disabled={isProcessing || isLoading}
                            >
                                {isProcessing || isLoading ? (
                                    <>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.processButtonText}>Creating Tasks...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#fff" />
                                        <Text style={styles.processButtonText}>Create Tasks with AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Generated Tasks Preview */}
                    {generatedTasks.length > 0 && (
                        <View style={styles.tasksPreviewSection}>
                            <Text style={styles.tasksPreviewTitle}>✨ Generated Tasks</Text>
                            {generatedTasks.map((task, index) => (
                                <View key={index} style={styles.taskPreviewItem}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
                                    <Text style={styles.taskPreviewText}>{task}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Instructions */}
                    <View style={styles.instructionsSection}>
                        <Text style={styles.instructionsTitle}>💡 How it works</Text>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionStep}>1.</Text>
                            <Text style={styles.instructionText}>
                                {Platform.OS === 'web' 
                                    ? 'Speak or type your tasks naturally'
                                    : 'Type your tasks in natural language'
                                }
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionStep}>2.</Text>
                            <Text style={styles.instructionText}>AI extracts individual tasks with times and dates</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionStep}>3.</Text>
                            <Text style={styles.instructionText}>Tasks are automatically saved to your calendar</Text>
                        </View>
                        
                        <Text style={styles.exampleText}>
                            💬 Example: "I need to buy groceries tomorrow at 3 PM, call mom tonight, and finish the report by Friday"
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8fd',
    },
    header: {
        backgroundColor: '#2563eb',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingTop: 36,
        paddingBottom: 24,
        paddingHorizontal: 24,
        marginBottom: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#e0e7ff',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    // Voice Recording Styles
    recordingSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    recordingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    recordButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: 16,
    },
    recordButtonActive: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
    },
    recordingStatus: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    soundWaves: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    wave: {
        width: 4,
        backgroundColor: '#dc2626',
        marginHorizontal: 2,
        borderRadius: 2,
    },
    wave1: { height: 20 },
    wave2: { height: 30 },
    wave3: { height: 15 },
    // Text Input Styles
    textInputSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        minHeight: 100,
        fontSize: 16,
        color: '#374151',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textInputButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#22c55e',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    switchModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    switchModeText: {
        color: '#2563eb',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '500',
    },
    // Transcript Styles
    transcriptSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    transcriptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    transcriptTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    clearButton: {
        padding: 4,
    },
    transcriptContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        minHeight: 100,
    },
    transcriptText: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    processButton: {
        backgroundColor: '#22c55e',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    processButtonDisabled: {
        backgroundColor: '#94a3b8',
        shadowColor: '#94a3b8',
    },
    processButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    // Tasks Preview Styles
    tasksPreviewSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    tasksPreviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 12,
    },
    taskPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    taskPreviewText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
        flex: 1,
    },
    // Instructions Styles
    instructionsSection: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    instructionsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    instructionStep: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
        marginRight: 8,
        minWidth: 20,
    },
    instructionText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
        lineHeight: 22,
    },
    exampleText: {
        fontSize: 14,
        color: '#64748b',
        fontStyle: 'italic',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
});