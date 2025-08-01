import { Text, View } from "react-native";
// import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";
import React from 'react';
import { Image, StyleSheet } from 'react-native';

type UserData = {
    id: string;
    name: string;
    mommy_lvl: number;
    ai_personality?: number;
    number: string;
};

function Index() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const { session } = useAppContext();

    const fetchUserData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const { data, error } = await supabase
                .from("Profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error) throw error;
            setUserData(data);
            console.log("🏠 Home refreshed user data:", data);
        } catch (error) {
            console.log("Error fetching userData:", error);
        }
    }, [session]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [fetchUserData])
    );

    // Also refresh on initial mount
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/images/mom-baby-mother-nurturing-love-260nw-1873658500.webp')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to Mommy-AI</Text>
            <Text style={styles.subtitle}>Your personal assistant</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>To Do List</Text>
                {userData ? (
                    <View style={styles.infoGroup}>
                        <Text style={styles.infoLabel}>Name:</Text>
                        <Text style={styles.infoValue}>{userData.name}</Text>
                        <Text style={styles.infoLabel}>Mommy Level:</Text>
                        <Text style={styles.infoValue}>{userData.mommy_lvl}</Text>
                        <Text style={styles.infoLabel}>AI Personality:</Text>
                        <Text style={styles.infoValue}>{userData.ai_personality || 0}</Text>
                        <Text style={styles.infoLabel}>Number:</Text>
                        <Text style={styles.infoValue}>{userData.number}</Text>
                    </View>
                ) : (
                    <Text style={styles.noData}>No data fetched</Text>
                )}
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
        backgroundColor: '#ffe6f0',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: '#fff0f6',
        shadowColor: '#e75480',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#e75480',
        marginBottom: 4,
        textShadowColor: '#f7eaff',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: 17,
        color: '#a259c2',
        marginBottom: 24,
        fontWeight: '500',
    },
    card: {
        width: '90%',
        backgroundColor: '#fff0f6',
        borderRadius: 18,
        padding: 22,
        shadowColor: '#e75480',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#f7eaff',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#a259c2',
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: 1,
    },
    infoGroup: {
        marginTop: 8,
    },
    infoLabel: {
        fontSize: 16,
        color: '#e75480',
        marginTop: 10,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 18,
        color: '#a259c2',
        fontWeight: '500',
    },
    noData: {
        fontSize: 16,
        color: '#c00',
        textAlign: 'center',
        marginTop: 12,
    },
});

export default Index;
