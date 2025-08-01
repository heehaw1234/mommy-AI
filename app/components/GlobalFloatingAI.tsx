import React from 'react';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { FloatingAINavigator } from './FloatingAINavigator';
import { useMommyLevel } from '../../contexts/MommyLevelContext';
import { useTaskContext } from '../../contexts/TaskContext';

export const GlobalFloatingAI: React.FC = () => {
    const router = useRouter();
    const segments = useSegments();
    const { mommyLevel } = useMommyLevel();
    const { tasksList } = useTaskContext();
    
    // Don't show on auth page
    const isAuthPage = segments.length === 1 && segments[0] === 'auth';
    
    if (isAuthPage || mommyLevel === undefined) {
        return null;
    }
    
    return (
        <View 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 10000,
                pointerEvents: 'box-none' // Allow touches to pass through to content below
            }}
        >
            <FloatingAINavigator 
                mommyLevel={mommyLevel}
                tasks={tasksList}
            />
        </View>
    );
};

export default GlobalFloatingAI;
