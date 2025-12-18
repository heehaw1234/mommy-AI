import React from 'react';
import { TextInput } from 'react-native';

interface FormInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
}

export const FormInput: React.FC<FormInputProps> = ({ 
    placeholder, 
    value, 
    onChangeText, 
    multiline = false, 
    numberOfLines = 1 
}) => (
    <TextInput
        style={{
            borderWidth: 0,
            borderRadius: 14,
            padding: 14,
            width: "100%",
            marginBottom: 14,
            backgroundColor: "#fff",
            fontSize: 16,
            shadowColor: "#4f8cff",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
            elevation: 1,
            height: multiline ? 100 : undefined,
            textAlignVertical: multiline ? "top" : "center",
        }}
        placeholder={placeholder}
        placeholderTextColor="#b6c3d1"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
    />
);