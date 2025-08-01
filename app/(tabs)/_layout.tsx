import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, Animated } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import your screen components
import HomeScreen from './home';
import SecondScreen from './second';
import ThirdScreen from './third';
import VoiceScreen from './voice';
import ChatbotScreen from './chatbot';
import ProfileScreen from './profile';

const { width } = Dimensions.get('window');

const tabs = [
    { name: 'home', title: 'Home', icon: 'home-outline', component: HomeScreen },
    { name: 'second', title: 'Tasks', icon: 'list-outline', component: SecondScreen },
    { name: 'third', title: 'Calendar', icon: 'calendar-outline', component: ThirdScreen },
    { name: 'voice', title: 'Voice', icon: 'mic-outline', component: VoiceScreen },
    { name: 'chatbot', title: 'Chat', icon: 'chatbubbles-outline', component: ChatbotScreen },
    { name: 'profile', title: 'Profile', icon: 'person-circle-outline', component: ProfileScreen },
];

export default function TabLayout() {
    const [activeTab, setActiveTab] = useState(0);
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const pagerRef = useRef<PagerView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Hide swipe hint after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }).start(() => setShowSwipeHint(false));
        }, 3000);

        return () => clearTimeout(timer);
    }, [fadeAnim]);

    const handleTabPress = (index: number) => {
        setActiveTab(index);
        pagerRef.current?.setPage(index);
    };

    const handlePageSelected = (event: any) => {
        const newIndex = event.nativeEvent.position;
        setActiveTab(newIndex);
    };

    const handlePageScroll = (event: any) => {
        // Optional: Add smooth transitions during scroll
        // You can add animation logic here if needed
    };

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                {/* Swipeable Content */}
                <PagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={0}
                    onPageSelected={handlePageSelected}
                    onPageScroll={handlePageScroll}
                    orientation="horizontal"
                    overdrag={true}
                    scrollEnabled={true}
                >
                    {tabs.map((tab, index) => (
                        <View key={tab.name} style={{ flex: 1 }}>
                            <tab.component />
                        </View>
                    ))}
                </PagerView>

                {/* Custom Tab Bar */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 8,
                    paddingBottom: 20,
                    paddingTop: 8,
                }}>
                    {tabs.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.name}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingHorizontal: 4,
                            }}
                            onPress={() => handleTabPress(index)}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                transform: [{ scale: activeTab === index ? 1.1 : 1 }],
                            }}>
                                <Ionicons
                                    name={tab.icon as any}
                                    size={24}
                                    color={activeTab === index ? '#2563eb' : '#6b7280'}
                                    style={{ marginBottom: 4 }}
                                />
                            </View>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: activeTab === index ? '600' : '400',
                                color: activeTab === index ? '#2563eb' : '#6b7280',
                                textAlign: 'center',
                            }}>
                                {tab.title}
                            </Text>
                            {activeTab === index && (
                                <View style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#2563eb',
                                    marginTop: 2,
                                }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Swipe Indicator - Auto-hide after 3 seconds */}
                {showSwipeHint && (
                    <Animated.View style={{
                        position: 'absolute',
                        top: 50,
                        right: 20,
                        backgroundColor: 'rgba(37, 99, 235, 0.9)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        zIndex: 1000,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                        opacity: fadeAnim,
                    }}>
                        <Ionicons name="swap-horizontal-outline" size={16} color="#ffffff" />
                        <Text style={{ 
                            color: '#ffffff', 
                            fontSize: 12, 
                            marginLeft: 4,
                            fontWeight: '500'
                        }}>
                            Swipe to navigate
                        </Text>
                    </Animated.View>
                )}

                {/* Page Indicator Dots */}
                <View style={{
                    position: 'absolute',
                    bottom: 100,
                    alignSelf: 'center',
                    flexDirection: 'row',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                }}>
                    {tabs.map((_, index) => (
                        <View
                            key={index}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: activeTab === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                marginHorizontal: 3,
                            }}
                        />
                    ))}
                </View>
            </View>
        </SafeAreaProvider>
    );
}
