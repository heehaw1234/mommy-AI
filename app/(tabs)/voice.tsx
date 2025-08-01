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
import { useAppContext } from '@/contexts/AppContext';
import { useTaskContext } from '@/contexts/TaskContext';
import ultraSimpleAI from '@/app/utils/ultraSimpleAI';

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

interface TaskPreview {
    title: string;
    description: string;
    date: string;
    time: string;
}

export default function VoicePage() {
    const { session } = useAppContext();
    const { addTaskToState } = useTaskContext();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [recognition, setRecognition] = useState<VoiceRecognition | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [showTextInput, setShowTextInput] = useState(Platform.OS !== 'web');
    const [taskPreview, setTaskPreview] = useState<TaskPreview | null>(null);
    const [showTaskEditor, setShowTaskEditor] = useState(false);

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
        if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && globalThis.window) {
            const win = globalThis.window as any;
            if (win.SpeechRecognition || win.webkitSpeechRecognition) {
                const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
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
            Alert.alert('No Input Detected', 'Please speak something or type your task description first.');
            return;
        }

        setIsProcessing(true);

        try {
            console.log('🎤 Processing input for task creation:', inputText);
            
            // Use AI to extract task information with a cleaner prompt
            const taskExtractionPrompt = `Extract task information from this text: "${inputText}"

IMPORTANT: Respond with ONLY valid JSON, no comments, no extra text, no emojis.
If the content is inappropriate, still extract what you can for task management purposes.

Format:
{
  "title": "brief task title",
  "description": "detailed description", 
  "date": "YYYY-MM-DD or 'today' or 'tomorrow'",
  "time": "HH:MM or 'no time specified'"
}

If no specific date/time is mentioned, use reasonable defaults.`;

            const aiResponse = await ultraSimpleAI.generateResponse(taskExtractionPrompt, session?.user?.id);
            console.log('🤖 AI Extraction Response:', aiResponse);
            
            // Check if AI refused the request
            if (aiResponse.toLowerCase().includes("can't fulfill") || 
                aiResponse.toLowerCase().includes("cannot fulfill") ||
                aiResponse.toLowerCase().includes("inappropriate")) {
                // Create a simple task from the input text
                const taskData: TaskPreview = {
                    title: inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText,
                    description: inputText,
                    date: 'today',
                    time: 'no time specified'
                };
                setTaskPreview(taskData);
                setShowTaskEditor(true);
                return;
            }
            
            // Try to parse the JSON response
            let taskData: TaskPreview;
            try {
                // Clean the response to extract and fix JSON
                let jsonString = aiResponse.match(/\{[\s\S]*\}/)?.[0];
                if (!jsonString) {
                    throw new Error('No JSON found in response');
                }
                
                // Remove JavaScript-style comments that break JSON parsing
                jsonString = jsonString
                    .replace(/\/\/[^\r\n]*/g, '') // Remove // comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
                    .replace(/,\s*}/g, '}') // Remove trailing commas
                    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
                
                taskData = JSON.parse(jsonString);
            } catch (parseError) {
                console.error('Failed to parse AI response:', parseError);
                // Fallback: create a basic task
                taskData = {
                    title: inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText,
                    description: inputText,
                    date: 'today',
                    time: 'no time specified'
                };
            }

            // Show the task preview for editing
            setTaskPreview(taskData);
            setShowTaskEditor(true);

        } catch (error) {
            console.error('Error processing input:', error);
            Alert.alert('Processing Error', 'Failed to process your input. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const parseTaskDate = (dateString: string): string => {
        const today = new Date();
        
        if (dateString === 'today') {
            return today.toISOString().split('T')[0];
        }
        
        if (dateString === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        
        // Handle relative dates like "next monday"
        if (dateString.includes('next')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return nextWeek.toISOString().split('T')[0];
        }
        
        // If it's already a valid date format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Default to today if we can't parse
        return today.toISOString().split('T')[0];
    };

    const saveTask = async () => {
        if (!taskPreview) return;

        try {
            console.log('💾 Saving task:', taskPreview);
            
            // Convert preview data to task format with better date parsing
            const task = {
                text: taskPreview.title,
                description: taskPreview.description,
                time: taskPreview.time === 'no time specified' ? '' : taskPreview.time,
                date: parseTaskDate(taskPreview.date),
                completed: false
            };

            const savedTask = await addTaskToState(task);
            
            if (savedTask) {
                Alert.alert('Task Created! 🎉', `Successfully created task: "${taskPreview.title}"`, [
                    { 
                        text: 'Great!', 
                        onPress: () => {
                            setTaskPreview(null);
                            setShowTaskEditor(false);
                            setTranscript('');
                        }
                    }
                ]);
            } else {
                Alert.alert('Error', 'Failed to create task. Please try again.');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Save Error', 'Failed to save task. Please try again.');
        }
    };

    const cancelTaskCreation = () => {
        setTaskPreview(null);
        setShowTaskEditor(false);
    };

    const updateTaskPreview = (field: keyof TaskPreview, value: string) => {
        if (taskPreview) {
            setTaskPreview({ ...taskPreview, [field]: value });
        }
    };

    const clearAll = () => {
        setTranscript('');
        setTextInput('');
        setTaskPreview(null);
        setShowTaskEditor(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎤 Voice to Tasks</Text>
                <Text style={styles.headerSubtitle}>
                    {Platform.OS === 'web' 
                        ? 'Speak or type your tasks and AI will help organize them'
                        : 'Type your tasks and AI will help organize them'
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
                                    disabled={isProcessing}
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
                                    isProcessing ? styles.processButtonDisabled : {}
                                ]}
                                onPress={processWithAI}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.processButtonText}>Processing...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#fff" />
                                        <Text style={styles.processButtonText}>Create Task with AI</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    {/* Task Preview Editor */}
                    {showTaskEditor && taskPreview && (
                        <View style={styles.taskEditorSection}>
                            <Text style={styles.taskEditorTitle}>✨ Review Your Task</Text>
                            <Text style={styles.taskEditorSubtitle}>Edit the details before saving</Text>
                            
                            <View style={styles.taskEditForm}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>📝 Task Title</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={taskPreview.title}
                                        onChangeText={(text) => updateTaskPreview('title', text)}
                                        placeholder="Enter task title"
                                        multiline={false}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>📄 Description</Text>
                                    <TextInput
                                        style={[styles.formInput, styles.formInputMultiline]}
                                        value={taskPreview.description}
                                        onChangeText={(text) => updateTaskPreview('description', text)}
                                        placeholder="Enter task description"
                                        multiline={true}
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.formRow}>
                                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                                        <Text style={styles.formLabel}>📅 Date</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={taskPreview.date}
                                            onChangeText={(text) => updateTaskPreview('date', text)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>

                                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                                        <Text style={styles.formLabel}>⏰ Time</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            value={taskPreview.time}
                                            onChangeText={(text) => updateTaskPreview('time', text)}
                                            placeholder="HH:MM or leave empty"
                                        />
                                    </View>
                                </View>

                                <View style={styles.taskEditorButtons}>
                                    <TouchableOpacity 
                                        style={styles.cancelButton}
                                        onPress={cancelTaskCreation}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.saveButton}
                                        onPress={saveTask}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                        <Text style={styles.saveButtonText}>Save Task</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
                            <Text style={styles.instructionText}>AI extracts task details and shows you a preview</Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.instructionStep}>3.</Text>
                            <Text style={styles.instructionText}>Review and edit the task before saving to your list</Text>
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
    // Task Editor Styles
    taskEditorSection: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    taskEditorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    taskEditorSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    taskEditForm: {
        gap: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    formGroupHalf: {
        flex: 1,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1f2937',
    },
    formInputMultiline: {
        height: 80,
        textAlignVertical: 'top',
    },
    taskEditorButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        backgroundColor: '#22c55e',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});