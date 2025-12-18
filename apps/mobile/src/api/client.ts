import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Get API base URL from config or use default
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ||
    (__DEV__ ? 'http://localhost:3001' : 'https://your-production-api.com');

interface ChatResponse {
    text: string;
    personality: {
        mommyLvl: number;
        aiPersonality: number;
    };
}

interface ExtractedTask {
    title: string;
    description: string;
    time: string;
    date: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
}

interface TaskExtractionResponse {
    tasks: ExtractedTask[];
    originalInput: string;
    confidence: number;
    processingTime: number;
}

/**
 * Get the current user's auth token
 */
async function getAuthToken(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody}`);
    }

    return response.json();
}

/**
 * API Client for Mommy AI Backend
 */
export const api = {
    /**
     * Send a chat message and get AI response
     */
    chat: async (message: string, userId?: string): Promise<ChatResponse> => {
        console.log('🌐 API: Sending chat request to backend...');

        const response = await apiRequest<ChatResponse>('/v1/chat', {
            method: 'POST',
            body: JSON.stringify({ message, userId })
        });

        console.log('✅ API: Chat response received');
        return response;
    },

    /**
     * Extract structured tasks from natural language
     */
    extractTasks: async (
        input: string,
        userId?: string,
        contextHints?: { currentTime?: Date; existingTasks?: any[] }
    ): Promise<TaskExtractionResponse> => {
        console.log('🌐 API: Sending task extraction request...');

        const response = await apiRequest<TaskExtractionResponse>('/v1/tasks/extract', {
            method: 'POST',
            body: JSON.stringify({
                input,
                userId,
                contextHints: contextHints ? {
                    currentTime: contextHints.currentTime?.toISOString(),
                    existingTasks: contextHints.existingTasks
                } : undefined
            })
        });

        console.log(`✅ API: Extracted ${response.tasks.length} tasks`);
        return response;
    },

    /**
     * Check if backend is healthy
     */
    healthCheck: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('❌ API: Health check failed:', error);
            return false;
        }
    }
};

export type { ChatResponse, ExtractedTask, TaskExtractionResponse };
export { API_BASE_URL };
