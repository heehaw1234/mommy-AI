import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface PickerFieldProps {
    value: string;
    placeholder: string;
    onPress: () => void;
    icon: React.ReactNode;
}

export const PickerField: React.FC<PickerFieldProps> = ({ value, placeholder, onPress, icon }) => (
    <TouchableOpacity
        style={{
            borderWidth: 0,
            borderRadius: 14,
            padding: 14,
            width: "100%",
            marginBottom: 14,
            backgroundColor: "#fff",
            shadowColor: "#4f8cff",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
            elevation: 1,
            flexDirection: "row",
            alignItems: "center",
        }}
        onPress={onPress}
    >
        {icon}
        <Text style={{ 
            color: value ? "#222" : "#b6c3d1", 
            marginLeft: 8,
            flex: 1
        }}>
            {value || placeholder}
        </Text>
    </TouchableOpacity>
);