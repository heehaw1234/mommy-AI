import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    color?: string;
    style?: object;
    textStyle?: object;
    icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({ 
    title, 
    onPress, 
    color = "#2563eb", 
    style = {}, 
    textStyle = {}, 
    icon = null 
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={{
            backgroundColor: color,
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 16,
            marginVertical: 4,
            alignItems: "center",
            shadowColor: color,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            flexDirection: "row",
            justifyContent: "center",
            ...style,
        }}
        activeOpacity={0.75}
    >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: 17,
            letterSpacing: 0.5,
            ...textStyle,
        }}>{title}</Text>
    </TouchableOpacity>
);