import AsyncStorage from '@react-native-async-storage/async-storage';

const FLOATING_AI_POSITION_KEY = 'floating_ai_position';

export interface FloatingAIPosition {
    x: number;
    y: number;
}

export const saveFloatingAIPosition = async (position: FloatingAIPosition): Promise<void> => {
    try {
        await AsyncStorage.setItem(FLOATING_AI_POSITION_KEY, JSON.stringify(position));
    } catch (error) {
        console.error('Error saving floating AI position:', error);
    }
};

export const loadFloatingAIPosition = async (): Promise<FloatingAIPosition | null> => {
    try {
        const positionJson = await AsyncStorage.getItem(FLOATING_AI_POSITION_KEY);
        if (positionJson) {
            return JSON.parse(positionJson);
        }
    } catch (error) {
        console.error('Error loading floating AI position:', error);
    }
    return null;
};

export const getDefaultPosition = (): FloatingAIPosition => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = require('react-native').Dimensions.get('window');
    const BUTTON_SIZE = 64;
    return {
        x: SCREEN_WIDTH - BUTTON_SIZE - 20,
        y: SCREEN_HEIGHT - BUTTON_SIZE - 100
    };
};
