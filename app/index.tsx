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
    type UserData = {
        id: string;
        name: string;
        mommy_lvl: number;
        number: string;
    };

    useEffect(() => {
        setIsLoading(true);
        const fetchProfile = async () => {
            try {
                if (!session?.user?.id) {
                    setIsLoading(false);
                    return;
                }
                const {data, error} = await supabase
                    .from("Profiles")
                    .select("*")
                    .eq('id', session.user.id);
                if (error) throw error;
                if (data.length !== 0) router.replace("/home");
                //if user already has row in Profiles then no need to setup

            } catch (error) {
                console.log("error retrieving userData", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, [session]);

    const handleSetup = async () => {
        if (name === "") {
            Alert.alert("Please enter a name");
            return;
        }
        if (!session?.user?.id) return; // Guard clause
        setIsLoading(true);
        //other fields like created_at and updated_at will be auto inserted
        const userInsert = {
            id: session.user.id,
            number: session.user.phone,
            name: name,
            mommy_lvl: (value/0.25) + 1
        }
        try {
            const {error} = await supabase
                .from("Profiles")
                .insert(userInsert);
            if (error) throw error;
            console.log("uploaded successfully");
            router.replace("/home");
        } catch (error) {
            console.log("error inserting profile", error);
        } finally {
            setIsLoading(false);

        }

    }
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
        // 10 stages, so 0-0.099 = 0, 0.1-0.199 = 1, ..., 0.9-1 = 9
        return Math.min(4, Math.floor(value * 5));
    }

    const [value, setValue] = useState(0.5);
    const [name, setName] = useState("");

    const idx = getStageIndex(value);
    const emoji = EMOJIS[idx];
    const label = LABELS[idx];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f4f8" }}>
                <Text style={{ fontSize: 50 }}>
                    {emoji}
                </Text>
                <Text style={{ marginTop: 30, fontSize: 18, color: "#e75480", fontWeight: "bold" }}>
                    {label}
                </Text>
                <Slider style={{width:300, height:40}}
                    minimumValue={0}
                    maximumValue={1}
                    value={value}
                    onValueChange={setValue}
                    step={0.25}
                    minimumTrackTintColor="#e75480"
                    maximumTrackTintColor="#b6c3d1"
                    thumbTintColor="#e75480"/>
                <View style={{ flexDirection: "row", marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
                    {EMOJIS.map((e, i) => (
                        <View key={i} style={{ alignItems: "center", width: 32, marginHorizontal: 15 }}>
                            <Text style={{ fontSize: 28 }}>{e}</Text>
                        </View>))}
                </View>
                <View style={{ flexDirection: "row", marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {LABELS.map((l, i) => (
                        <Text key={i} style={{ fontSize: 10, width: 38, marginHorizontal:15, textAlign: "center", color: "#e75480" }}>{l}</Text>
                    ))}
                </View>
                <View>
                    <TextInput style={styles.input} placeholder="Enter your name" onChangeText={setName} value={name}/>
                </View>
                <View>
                    <Pressable
                        onPress={handleSetup}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
                    </Pressable>
            </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    )
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
    })