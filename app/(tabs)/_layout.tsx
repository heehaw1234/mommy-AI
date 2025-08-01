import React from "react";
import { Tabs, Stack, Redirect } from "expo-router";

export default function TabLayout() {

    return (
        <Tabs
        screenOptions={{
            headerShown: false
        }}>
            <Tabs.Screen name='home'/>
            <Tabs.Screen name='second'/>
            <Tabs.Screen name='third'/>
            <Tabs.Screen 
                name='fourth'
                options={{
                    title: 'Personality',
                    tabBarLabel: 'Personality'
                }}
            />
            <Tabs.Screen name='chatbot'/>
            <Tabs.Screen name='profiel'/>
        </Tabs>
    )
}