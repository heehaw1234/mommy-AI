import React, { useEffect } from "react";
import { Slot, Redirect, useRouter, useSegments } from "expo-router";
import { AppProvider, useAppContext } from "@/contexts/AppContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { MommyLevelProvider } from "@/contexts/MommyLevelContext";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

function AuthChecker() {
    const { loggedIn, isLoading } = useAppContext();
    const router = useRouter();
    const segments = useSegments();

    console.log('🛡️ AuthChecker: Auth state check:', {
        loggedIn,
        isLoading,
        currentSegments: segments
    });

    useEffect(() => {
        if (isLoading) return; // Don't navigate while loading

        // Check if we're on the auth screen
        const onAuthScreen = segments.length === 1 && segments[0] === 'auth';

        console.log('🔍 Route analysis:', {
            segments,
            onAuthScreen,
            loggedIn,
            isLoading
        });

        if (!loggedIn && !onAuthScreen) {
            console.log('🚪 AuthChecker: User not logged in, navigating to auth');
            router.replace('/auth');
        } else if (loggedIn && onAuthScreen) {
            console.log('✅ AuthChecker: User logged in, navigating to home');
            router.replace('/');
        }
    }, [loggedIn, isLoading, segments]);

    if (isLoading) {
        console.log('⏳ AuthChecker: Showing loading state');
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    console.log('🎯 AuthChecker: Rendering current route');
    return (
        <Slot />
    );
}

export default function RootLayout() {
    console.log('🏗️ RootLayout: Component rendering');

    return (
        <AppProvider>
            <TaskProvider>
                <MommyLevelProvider>
                    <AuthChecker />
                </MommyLevelProvider>
            </TaskProvider>
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});