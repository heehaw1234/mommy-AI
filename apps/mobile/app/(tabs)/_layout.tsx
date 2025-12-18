import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false
            }}
        >
            <Tabs.Screen name='home'/>
            <Tabs.Screen name='second'/>
            <Tabs.Screen name='third'/>
            <Tabs.Screen 
                name='voice'
                options={{
                    title: 'Voice Tasks',
                    tabBarLabel: 'Voice'
                }}
            />
            <Tabs.Screen 
                name='fourth'
                options={{
                    title: 'Personality',
                    tabBarLabel: 'Personality',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name='chatbot'
                options={{
                    title: 'Chat',
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name='profiel'
                options={{
                    title: 'Profile',
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}
