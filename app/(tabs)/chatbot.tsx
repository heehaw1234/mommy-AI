import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from "@react-native-community/slider";
import UltraSimpleAI from '../utils/ultraSimpleAI';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from "@/lib/supabase";
import { MotivationCoach, StressLevel, LearningStyle } from '../utils/motivationCoach';

// Personality constants
const MOMMY_EMOJIS = [
    "🙂", "😐", "😑", "😕", "😒", "😠", "😡", "🤬", "👿", "💢"
];

const MOMMY_LABELS = [
    "Sweet Mommy", "Caring", "Helpful", "Direct", "Firm", 
    "Stern", "Demanding", "Fierce", "Domineering", "Alpha Mommy"
];

const MOMMY_DESCRIPTIONS = [
    "💕 Sweet and nurturing, always encouraging",
    "😊 Warm and supportive, gentle guidance", 
    "🤝 Helpful and straightforward responses",
    "📝 Direct communication, gets to the point",
    "💪 Firm guidance, no-nonsense approach",
    "😤 Stern tone, expects you to do better",
    "⚡ Demanding excellence, pushes you harder",
    "🔥 Fierce motivation, very intense responses",
    "👑 Domineering style, takes full control",
    "💯 Maximum intensity, alpha energy"
];

const PERSONALITY_EMOJIS = [
    "😊", "🤓", "💼", "😂", "😏", "🎭", "🤔", "🔥", "😎", "🤖"
];

const PERSONALITY_LABELS = [
    "Friendly", "Smart", "Professional", "Funny", "Sarcastic",
    "Dramatic", "Philosophical", "Motivational", "Cool", "Robotic"
];

const PERSONALITY_DESCRIPTIONS = [
    "😊 Warm, welcoming, and always positive",
    "🤓 Intelligent, informative, loves sharing knowledge", 
    "💼 Formal, business-like, gets straight to work",
    "😂 Humorous, entertaining, loves making jokes",
    "😏 Witty with a bite, uses clever sarcasm",
    "🎭 Theatrical, expressive, everything is dramatic",
    "🤔 Deep thinker, philosophical, asks big questions",
    "🔥 Inspiring, energetic, pushes you to succeed",
    "😎 Confident, laid-back, effortlessly cool",
    "🤖 Systematic, formal, precise and logical"
];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isSystem?: boolean;
}

export default function ChatbotScreen() {
  const { session } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I\'m your AI study buddy. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Personality state
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [tempMommyLevel, setTempMommyLevel] = useState(0);
  const [tempPersonality, setTempPersonality] = useState(0);
  const [currentMommyLevel, setCurrentMommyLevel] = useState(0);
  const [currentPersonality, setCurrentPersonality] = useState(0);

  // Motivation Coach state
  const [studentProfile, setStudentProfile] = useState(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [adaptivePersonalityEnabled, setAdaptivePersonalityEnabled] = useState(true);

  // Helper functions for stress level display
  const getStressLevelEmoji = (level: StressLevel): string => {
    switch (level) {
      case StressLevel.LOW: return '😌';
      case StressLevel.MODERATE: return '😐';
      case StressLevel.HIGH: return '😰';
      case StressLevel.CRITICAL: return '🚨';
      default: return '😐';
    }
  };

  const getStressLevelText = (level: StressLevel): string => {
    switch (level) {
      case StressLevel.LOW: return 'Calm';
      case StressLevel.MODERATE: return 'Moderate';
      case StressLevel.HIGH: return 'High Stress';
      case StressLevel.CRITICAL: return 'Crisis Mode';
      default: return 'Moderate';
    }
  };

  // Load personality settings and student profile
  useEffect(() => {
    const loadPersonalitySettings = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from("Profiles")
          .select("mommy_lvl, ai_personality")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.log("Error loading personality settings:", error);
          return;
        }

        if (data) {
          setCurrentMommyLevel(data.mommy_lvl || 0);
          setCurrentPersonality(data.ai_personality || 0);
          setTempMommyLevel(data.mommy_lvl || 0);
          setTempPersonality(data.ai_personality || 0);
          console.log("Loaded personality settings:", data);
        }
      } catch (error) {
        console.log("Error loading personality settings:", error);
      }
    };

    const loadStudentProfile = async () => {
      if (!session?.user?.id) return;

      try {
        // Update student profile based on recent activity
        const profile = await MotivationCoach.updateStudentProfile(session.user.id);
        
        if (profile) {
          setStudentProfile(profile);
          
          // Get motivational message
          const message = MotivationCoach.getMotivationalMessage(profile);
          setMotivationalMessage(message);
          
          // Apply adaptive personality if enabled
          if (adaptivePersonalityEnabled) {
            const adaptiveSettings = MotivationCoach.getAdaptivePersonality(profile);
            setCurrentMommyLevel(adaptiveSettings.mommyLevel);
            setCurrentPersonality(adaptiveSettings.personalityType);
            
            // Update in database
            await supabase
              .from("Profiles")
              .update({ 
                mommy_lvl: adaptiveSettings.mommyLevel,
                ai_personality: adaptiveSettings.personalityType 
              })
              .eq("id", session.user.id);
          }
        }
      } catch (error) {
        console.log("Error loading student profile:", error);
      }
    };

    loadPersonalitySettings();
    loadStudentProfile();
    
    // Set up periodic profile updates (every 5 minutes)
    const interval = setInterval(loadStudentProfile, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session, adaptivePersonalityEnabled]);

  const handlePersonalityChange = async () => {
    if (!session?.user?.id) return;

    try {
      console.log(tempPersonality);
      const { error } = await supabase
        .from("Profiles")
        .update({ 
          mommy_lvl: tempMommyLevel,
          ai_personality: tempPersonality 
        })
        .eq("id", session.user.id);

      if (error) {
        console.log("Error updating personality:", error);
        return;
      }

      setCurrentMommyLevel(tempMommyLevel);
      setCurrentPersonality(tempPersonality);
      setShowPersonalityModal(false);

      // Add system message about personality change
      const personalityChangeMessage: Message = {
        id: Date.now().toString(),
        text: `✨ Personality updated! I'm now ${MOMMY_LABELS[tempMommyLevel]} with ${PERSONALITY_LABELS[tempPersonality]} style. ${MOMMY_DESCRIPTIONS[tempMommyLevel]}`,
        isUser: false,
        timestamp: new Date(),
        isSystem: true
      };

      setMessages(prev => [...prev, personalityChangeMessage]);
    } catch (error) {
      console.log("Error updating personality:", error);
    }
  };

  const openPersonalityModal = () => {
    setTempMommyLevel(currentMommyLevel);
    setTempPersonality(currentPersonality);
    setShowPersonalityModal(true);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call ultra-reliable AI service with user ID for personality
      const response = await UltraSimpleAI.generateResponse(
        userMessage.text, 
        session?.user?.id // Pass user ID for personality customization
      );
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Llama API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.botMessageText,
      ]}>
        {message.text}
      </Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>AI Study Buddy</Text>
          <Text style={styles.headerSubtitle}>
            {studentProfile ? 
              `${getStressLevelEmoji(studentProfile.stressLevel)} ${getStressLevelText(studentProfile.stressLevel)} • Motivation: ${studentProfile.currentMotivationLevel}/10` 
              : 'Powered by Llama'
            }
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.personalityButton, adaptivePersonalityEnabled && styles.adaptiveActive]}
            onPress={openPersonalityModal}
          >
            <Text style={styles.personalityButtonText}>
              {PERSONALITY_EMOJIS[currentPersonality]} {MOMMY_LABELS[currentMommyLevel]}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.adaptiveToggle}
            onPress={() => setAdaptivePersonalityEnabled(!adaptivePersonalityEnabled)}
          >
            <Text style={styles.adaptiveToggleText}>
              {adaptivePersonalityEnabled ? '🤖 Auto' : '👤 Manual'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Motivational Message */}
          {motivationalMessage && (
            <View style={styles.motivationalMessageContainer}>
              <Text style={styles.motivationalMessageText}>
                💡 {motivationalMessage}
              </Text>
            </View>
          )}
          
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Personality Modal */}
      <Modal
        visible={showPersonalityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPersonalityModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPersonalityModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>AI Personality</Text>
            <TouchableOpacity onPress={handlePersonalityChange}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Adaptive Coaching Status */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🤖 Adaptive Coaching</Text>
              <Text style={styles.sectionDescription}>
                {adaptivePersonalityEnabled 
                  ? "AI automatically adjusts based on your stress level and learning style"
                  : "Manual personality control - AI won't change automatically"
                }
              </Text>
              
              {studentProfile && (
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Stress Level:</Text>
                    <Text style={styles.statValue}>
                      {getStressLevelEmoji(studentProfile.stressLevel)} {getStressLevelText(studentProfile.stressLevel)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Learning Style:</Text>
                    <Text style={styles.statValue}>
                      {studentProfile.learningStyle.charAt(0).toUpperCase() + studentProfile.learningStyle.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Motivation:</Text>
                    <Text style={styles.statValue}>
                      {studentProfile.currentMotivationLevel}/10
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Completion Rate:</Text>
                    <Text style={styles.statValue}>
                      {Math.round((studentProfile.learningPattern?.completionRate || 0) * 100)}%
                    </Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.toggleButton, adaptivePersonalityEnabled && styles.toggleButtonActive]}
                onPress={() => setAdaptivePersonalityEnabled(!adaptivePersonalityEnabled)}
              >
                <Text style={[styles.toggleButtonText, adaptivePersonalityEnabled && styles.toggleButtonTextActive]}>
                  {adaptivePersonalityEnabled ? '🤖 Adaptive Mode ON' : '👤 Manual Mode'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fierceness Level Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🔥 Fierceness Level</Text>
              <Text style={styles.sectionDescription}>How intense should I be?</Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.currentSelection}>
                  {MOMMY_EMOJIS[tempMommyLevel]} {MOMMY_LABELS[tempMommyLevel]} ({tempMommyLevel}/9)
                </Text>
                <Text style={styles.currentDescription}>
                  {MOMMY_DESCRIPTIONS[tempMommyLevel]}
                </Text>

                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={9}
                  step={1}
                  value={tempMommyLevel}
                  onValueChange={setTempMommyLevel}
                  minimumTrackTintColor="#e75480"
                  maximumTrackTintColor="#f0f0f0"
                  thumbTintColor="#e75480"
                />

                <View style={styles.levelGrid}>
                  {MOMMY_LABELS.map((label, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.levelCard,
                        tempMommyLevel === index && styles.levelCardSelected
                      ]}
                      onPress={() => setTempMommyLevel(index)}
                    >
                      <Text style={styles.levelEmoji}>{MOMMY_EMOJIS[index]}</Text>
                      <Text style={[
                        styles.levelLabel,
                        tempMommyLevel === index && styles.levelLabelSelected
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Personality Type Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🎭 Communication Style</Text>
              <Text style={styles.sectionDescription}>How should I communicate?</Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.currentSelection}>
                  {PERSONALITY_EMOJIS[tempPersonality]} {PERSONALITY_LABELS[tempPersonality]} ({tempPersonality}/9)
                </Text>
                <Text style={styles.currentDescription}>
                  {PERSONALITY_DESCRIPTIONS[tempPersonality]}
                </Text>

                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={9}
                  step={1}
                  value={tempPersonality}
                  onValueChange={setTempPersonality}
                  minimumTrackTintColor="#4a90e2"
                  maximumTrackTintColor="#f0f0f0"
                  thumbTintColor="#4a90e2"
                />

                <View style={styles.levelGrid}>
                  {PERSONALITY_LABELS.map((label, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.levelCard,
                        tempPersonality === index && styles.levelCardSelectedBlue
                      ]}
                      onPress={() => setTempPersonality(index)}
                    >
                      <Text style={styles.levelEmoji}>
                        {PERSONALITY_EMOJIS[index]}
                      </Text>
                      <Text style={[
                        styles.levelLabel,
                        tempPersonality === index && styles.levelLabelSelectedBlue
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  personalityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adaptiveActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  adaptiveToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  adaptiveToggleText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  personalityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  motivationalMessageContainer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  motivationalMessageText: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  currentSelection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  currentDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  levelCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    margin: 2,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  levelCardSelected: {
    backgroundColor: '#ffe6f0',
    borderColor: '#e75480',
    transform: [{ scale: 1.05 }],
  },
  levelCardSelectedBlue: {
    backgroundColor: '#e6f3ff',
    borderColor: '#4a90e2',
    transform: [{ scale: 1.05 }],
  },
  levelEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  levelLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  levelLabelSelected: {
    color: '#e75480',
    fontWeight: 'bold',
  },
  levelLabelSelectedBlue: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  // Motivation Coach styles
  profileStats: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
});
