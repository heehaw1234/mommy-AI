import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
}

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey || supabaseAnonKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Create a client for verifying user tokens
export const supabaseAuth: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/**
 * Verify a Supabase JWT token and return user data
 */
export async function verifyToken(token: string): Promise<{ userId: string; email?: string } | null> {
    try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

        if (error || !user) {
            console.log('❌ Token verification failed:', error?.message);
            return null;
        }

        return {
            userId: user.id,
            email: user.email
        };
    } catch (error) {
        console.error('❌ Token verification error:', error);
        return null;
    }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('Profiles')
            .select('id, mommy_lvl, ai_personality, name')
            .eq('id', userId)
            .single();

        if (error) {
            console.log('⚠️ Error fetching user profile:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ getUserProfile error:', error);
        return null;
    }
}
