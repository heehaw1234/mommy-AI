import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";
import  { useNotifications }  from '@/app/utils/useNotifications';

type UserData = {
    id: string;
    name: string;
    mommy_lvl: number;
    ai_personality?: number;
    number: string;
};

export default function Index() {
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
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
            }}
        >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                To do list
            </Text>

            {userData ? (
                <View>
                    <Text>name: {userData.name}</Text>
                    <Text>mommy_lvl: {userData.mommy_lvl}</Text>
                    <Text>ai_personality: {userData.ai_personality || 0}</Text>
                    <Text>number: {userData.number}</Text>
                </View>
            ) : (
                <Text>no data fetched</Text>
            )}
        </View>
    );
}
