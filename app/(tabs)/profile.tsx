import { Text, View, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
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
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            {userData ? (
                <View style={styles.profileContainer}>
                    {/* Name Section */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Name</Text>
                        {isEditing ? (
                            <View style={styles.editContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={editedName}
                                    onChangeText={setEditedName}
                                    placeholder="Enter your name"
                                    autoFocus
                                />
                                <View style={styles.editButtons}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleSaveName}
                                        disabled={isLoading || !editedName.trim()}
                                    >
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={handleCancelEdit}
                                        disabled={isLoading}
                                    >
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
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Other Profile Info */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Mommy Level</Text>
                        <Text style={styles.value}>{userData.mommy_lvl}</Text>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>AI Personality</Text>
                        <Text style={styles.value}>{userData.ai_personality || 0}</Text>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Number</Text>
                        <Text style={styles.value}>{userData.number}</Text>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={[styles.button, styles.logoutButton]}
                        onPress={handleLogOut}
                        disabled={isLoading}
                    >
                        <Text style={styles.logoutButtonText}>
                            {isLoading ? "Logging Out..." : "Log Out"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={styles.noDataText}>No data fetched</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2563eb',
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    profileContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    fieldContainer: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 18,
        color: '#1e293b',
        fontWeight: '500',
    },
    displayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editContainer: {
        gap: 12,
    },
    input: {
        borderWidth: 2,
        borderColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8fafc',
    },
    editButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    editButton: {
        backgroundColor: '#2563eb',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        flex: 1,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#64748b',
        flex: 1,
    },
    logoutButton: {
        backgroundColor: '#dc2626',
        marginTop: 20,
        paddingVertical: 12,
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
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#64748b',
        marginTop: 40,
    },
});