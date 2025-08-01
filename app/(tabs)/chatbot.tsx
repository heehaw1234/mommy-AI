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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from "@react-native-community/slider";
import UltraSimpleAI from '../utils/ultraSimpleAI';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from "@/lib/supabase";

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
      text: 'Hello! 👋 I\'m your AI assistant. How can I help you today?',
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

  // Load personality settings
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
        }
      } catch (error) {
        console.log("Error loading personality settings:", error);
      }
    };

    loadPersonalitySettings();
  }, [session]);

  const handlePersonalityChange = async () => {
    if (!session?.user?.id) return;

    try {
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
      <Image
        source={require('../../assets/images/mom-baby-mother-nurturing-love-260nw-1873658500.webp')}
        style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 12, backgroundColor: '#fff0f6', shadowColor: '#e75480', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#e75480', marginBottom: 4, textShadowColor: '#f7eaff', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>Mommy-AI Chatbot</Text>
      <Text style={{ fontSize: 17, color: '#a259c2', marginBottom: 18, fontWeight: '500' }}>Your personal assistant</Text>
      <View style={styles.card}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
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
      </View>

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
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    backgroundColor: '#ffe6f0', // beautiful pink
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
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
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#fff0f6', // light pink for visibility
    borderWidth: 1,
    borderColor: '#e75480', // dark pink border
    shadowColor: '#e75480',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e75480', // dark pink
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0f6', // light pink
    borderWidth: 1,
    borderColor: '#f7eaff', // purple accent
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  botMessageText: {
    color: '#a259c2', // purple
    fontWeight: '500',
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
    backgroundColor: '#fff0f6', // match theme
    borderTopWidth: 2,
    borderTopColor: '#e75480', // dark pink
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    shadowColor: '#e75480',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e75480', // dark pink
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#fff',
    color: '#e75480',
    fontWeight: '500',
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
  card: {
    width: '90%',
    backgroundColor: '#fff0f6', // light pink
    borderRadius: 18,
    padding: 22,
    shadowColor: '#e75480', // dark pink
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#f7eaff', // purple accent
    alignSelf: 'center',
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
});
