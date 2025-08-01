import {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, TextInput, TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {supabase} from "@/lib/supabase";
import {router} from "expo-router";
import {useAppContext} from "@/contexts/AppContext";

export default function Auth() {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const { loggedIn, isLoading } = useAppContext();

    useEffect(() => {
        if (!isLoading && loggedIn) {
            router.replace('/');
        }
    }, [loggedIn, isLoading]);

    const handlePhoneSignIn = async () => {
        if (!phone) {
            Alert.alert("Error", "Please enter your Singaporean number");
            return;
        } else if (phone.length !== 8) {
            Alert.alert("Error, We only accept phone number of length 8");
            return;
        }

        const formattedPhone = `${phone.replace(/\D/g, '')}`;

        try {
            setLoading(true);

            // Direct sign in without OTP verification
            const { data, error } = await supabase.auth.signInWithPassword({
                phone: formattedPhone,
                password: 'dummy_password' // You might need to handle this differently
            });

            if (error) {
                // If user doesn't exist, create them automatically
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    phone: formattedPhone,
                    password: 'dummy_password', // You'll need a different approach for passwordless
                });

                if (signUpError) throw signUpError;
                Alert.alert('Success', 'Account created and signed in successfully!');
            } else {
                Alert.alert('Success', 'Signed in successfully!');
            }
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Phone Sign In</Text>

            <Text style={styles.note}>Example: 9123 4567</Text>
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={8}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handlePhoneSignIn}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    note: {
        color: '#666',
        fontSize: 12,
        marginBottom: 15,
    },
    message: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#555',
    },
    link: {
        color: '#3b82f6',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: '500',
    }
});