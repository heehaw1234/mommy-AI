import { Text, View, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, SafeAreaView, StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";

type UserData = {
    id: string;
    name: string;
    mommy_lvl: number;
    ai_personality?: number;
    number: string;
};

export default function Index() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [editedName, setEditedName] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { session } = useAppContext();

    const handleLogOut = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const { error } = await supabase.auth.signOut();
                            if (error) throw error;
                        } catch (error) {
                            console.log("error signing out", error);
                            Alert.alert("Error", "Failed to log out. Please try again.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveName = async () => {
        if (!session?.user?.id || !editedName.trim()) return;

        try {
            setIsLoading(true);
            const { error } = await supabase
                .from("Profiles")
                .update({ name: editedName.trim() })
                .eq("id", session.user.id);

            if (error) throw error;

            setUserData(prev => prev ? { ...prev, name: editedName.trim() } : null);
            setIsEditing(false);
            Alert.alert("Success", "Name updated successfully!");
        } catch (error) {
            console.log("Error updating name:", error);
            Alert.alert("Error", "Failed to update name. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedName(userData?.name || "");
        setIsEditing(false);
    };

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
            setEditedName(data.name);
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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Ionicons name="person-circle" size={60} color="#ffffff" />
                        <Text style={styles.title}>Profile</Text>
                        <Text style={styles.subtitle}>Manage your account settings</Text>
                    </View>
                </View>

                {userData ? (
                    <View style={styles.profileContainer}>
                        {/* Profile Stats Cards */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Ionicons name="trophy" size={24} color="#f59e0b" />
                                <Text style={styles.statValue}>{userData.mommy_lvl}</Text>
                                <Text style={styles.statLabel}>Mommy Level</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                                <Text style={styles.statValue}>{userData.ai_personality || 0}</Text>
                                <Text style={styles.statLabel}>AI Personality</Text>
                            </View>
                        </View>

                        {/* Name Section */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.fieldHeader}>
                                <Ionicons name="person" size={20} color="#6366f1" />
                                <Text style={styles.label}>Display Name</Text>
                            </View>
                            {isEditing ? (
                                <View style={styles.editContainer}>
                                    <TextInput
                                        style={styles.input}
                                        value={editedName}
                                        onChangeText={setEditedName}
                                        placeholder="Enter your name"
                                        autoFocus
                                        placeholderTextColor="#94a3b8"
                                    />
                                    <View style={styles.editButtons}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.saveButton]}
                                            onPress={handleSaveName}
                                            disabled={isLoading || !editedName.trim()}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                                            <Text style={styles.buttonText}>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.button, styles.cancelButton]}
                                            onPress={handleCancelEdit}
                                            disabled={isLoading}
                                        >
                                            <Ionicons name="close" size={16} color="#64748b" />
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.displayContainer}>
                                    <Text style={styles.value}>{userData.name}</Text>
                                    <TouchableOpacity
                                        style={[styles.button, styles.editButton]}
                                        onPress={() => setIsEditing(true)}
                                    >
                                        <Ionicons name="create-outline" size={16} color="#ffffff" />
                                        <Text style={styles.buttonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Phone Number Section */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.fieldHeader}>
                                <Ionicons name="call" size={20} color="#6366f1" />
                                <Text style={styles.label}>Phone Number</Text>
                            </View>
                            <Text style={styles.value}>{userData.number}</Text>
                        </View>

                        {/* Account ID Section */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.fieldHeader}>
                                <Ionicons name="finger-print" size={20} color="#6366f1" />
                                <Text style={styles.label}>Account ID</Text>
                            </View>
                            <Text style={styles.valueSmall}>{userData.id.substring(0, 8)}...</Text>
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity
                            style={[styles.button, styles.logoutButton]}
                            onPress={handleLogOut}
                            disabled={isLoading}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                            <Text style={styles.logoutButtonText}>
                                {isLoading ? "Logging Out..." : "Sign Out"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
                        <Text style={styles.noDataText}>No profile data available</Text>
                        <Text style={styles.noDataSubtext}>Please try refreshing the app</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#6366f1',
    },
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        backgroundColor: '#6366f1',
        paddingBottom: 30,
        paddingTop: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    headerContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 12,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#e0e7ff',
        textAlign: 'center',
    },
    profileContainer: {
        padding: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textAlign: 'center',
    },
    fieldContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fieldHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    value: {
        fontSize: 18,
        color: '#1f2937',
        fontWeight: '500',
    },
    valueSmall: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'monospace',
    },
    displayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editContainer: {
        gap: 16,
    },
    input: {
        borderWidth: 2,
        borderColor: '#6366f1',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f8fafc',
        color: '#1f2937',
    },
    editButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
        flexDirection: 'row',
        gap: 6,
    },
    editButton: {
        backgroundColor: '#6366f1',
    },
    saveButton: {
        backgroundColor: '#10b981',
        flex: 1,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        flex: 1,
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        marginTop: 8,
        paddingVertical: 16,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 18,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 16,
    },
    noDataSubtext: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
    },
});