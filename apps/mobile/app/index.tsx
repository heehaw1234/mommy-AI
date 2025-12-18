// app/index.tsx - Fixed version
import {StyleSheet, Pressable, View, Text, TextInput, Alert} from "react-native";
import {Link, router} from 'expo-router'
import React, { useState, useEffect } from "react";
import Slider from "@react-native-community/slider";
import { ScrollView, SafeAreaView } from 'react-native'
import {supabase} from "@/lib/supabase";
import {useAppContext} from "@/contexts/AppContext";

export default function Index() {
    const {session} = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState(0.5);
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user?.id) {
                return;
            }

            setIsLoading(true);
            try {
                const {data, error} = await supabase
                    .from("Profiles")
                    .select("*")
                    .eq('id', session.user.id)
                    .single(); // Use single() for better error handling

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    throw error;
                }

                if (data) {
                    router.replace("/home");
                }
            } catch (error) {
                console.error("Error retrieving userData:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, [session]);

    const handleSetup = async () => {
        if (name.trim() === "") {
            Alert.alert("Error", "Please enter a name");
            return;
        }

        if (!session?.user?.id) {
            Alert.alert("Error", "User session not found");
            return;
        }

        setIsLoading(true);

        // Calculate mommy_lvl correctly (1-5 range)
        const mommyLevel = Math.floor((value / 0.25)) + 1;

        const userInsert = {
            id: session.user.id,
            number: session.user.phone || null, // Handle potential undefined phone
            name: name.trim(),
            mommy_lvl: mommyLevel
        };

        try {
            const {data, error} = await supabase
                .from("Profiles")
                .insert(userInsert)
                .select(); // Add select to return the inserted data

            if (error) {
                console.error("Insert error:", error);
                throw error;
            }

            console.log("Profile created successfully:", data);
            router.replace("/home");

        } catch (error) {
            console.error("Error inserting profile:", error);
            Alert.alert(
                "Error",
                "Failed to create profile. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const EMOJIS = [
        "🥴", // 1 - Uwu
        "😉", // 2 - Nice
        "😐", // 3 - basic
        "🐯", // 4 - asian tiger mom
        "😈", // 5 - menace
    ];

    const LABELS = [
        'Uwu',
        'Nice',
        'Basic',
        'Asian Tiger Mom',
        'Menace'
    ];

    // Helper: pick the closest emoji for the slider value
    function getStageIndex(value: number) {
        return Math.min(4, Math.floor(value * 5));
    }

    const idx = getStageIndex(value);
    const emoji = EMOJIS[idx];
    const label = LABELS[idx];

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#e75480" />
                    <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        onChangeText={setName}
                        value={name}
                        maxLength={50} // Add reasonable limit
                    />
                </View>

                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f4f8" }}>
                    <Text style={{ fontSize: 50 }}>
                        {emoji}
                    </Text>
                    <Text style={{ marginTop: 30, fontSize: 18, color: "#e75480", fontWeight: "bold" }}>
                        {label}
                    </Text>
                    <Slider
                        style={{width:300, height:40}}
                        minimumValue={0}
                        maximumValue={1}
                        value={value}
                        onValueChange={setValue}
                        step={0.25}
                        minimumTrackTintColor="#e75480"
                        maximumTrackTintColor="#b6c3d1"
                        thumbTintColor="#e75480"
                    />
                    <View style={{ flexDirection: "row", marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
                        {EMOJIS.map((e, i) => (
                            <View key={i} style={{ alignItems: "center", width: 32, marginHorizontal: 15 }}>
                                <Text style={{ fontSize: 28 }}>{e}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={{ flexDirection: "row", marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                        {LABELS.map((l, i) => (
                            <Text key={i} style={{ fontSize: 10, width: 38, marginHorizontal:15, textAlign: "center", color: "#e75480" }}>
                                {l}
                            </Text>
                        ))}
                    </View>
                    <View>
                        <Pressable
                            onPress={handleSetup}
                            style={[styles.button, isLoading && { opacity: 0.6 }]}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Continue</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: '#fff'
    },
    button: {
        marginTop: 24,
        alignSelf: 'center',
        backgroundColor: '#e75480',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
        fontSize: 16,
    }
});