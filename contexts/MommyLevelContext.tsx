import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppContext } from './AppContext';
import { supabase } from '@/lib/supabase';

interface MommyLevelContextType {
    mommyLevel: number;
    setMommyLevel: (level: number) => void;
    updateMommyLevel: (level: number) => Promise<boolean>;
    refreshMommyLevel: () => Promise<void>;
}

const MommyLevelContext = createContext<MommyLevelContextType | undefined>(undefined);

interface MommyLevelProviderProps {
    children: ReactNode;
}

export const MommyLevelProvider: React.FC<MommyLevelProviderProps> = ({ children }) => {
    const { session } = useAppContext();
    const [mommyLevel, setMommyLevel] = useState<number>(0);

    // Fetch mommy level from database
    const fetchMommyLevel = async (): Promise<void> => {
        if (!session?.user?.id) {
            console.log('🚫 No user session, cannot fetch mommy level');
            return;
        }
        
        console.log('🔍 Fetching mommy level for user:', session.user.id);
        
        try {
            const { data, error } = await supabase
                .from("Profiles")
                .select("mommy_lvl")
                .eq("id", session.user.id)
                .single();
            
            if (error) {
                console.error('❌ Error fetching mommy level:', error);
                return;
            }
            
            const fetchedLevel = data?.mommy_lvl || 0;
            setMommyLevel(fetchedLevel);
            console.log('✅ Successfully fetched mommy level:', fetchedLevel);
        } catch (error) {
            console.error('❌ Exception fetching mommy level:', error);
        }
    };

    // Update mommy level in database
    const updateMommyLevel = async (level: number): Promise<boolean> => {
        if (!session?.user?.id) {
            console.error('❌ No user session, cannot update mommy level');
            return false;
        }

        try {
            const { error } = await supabase
                .from("Profiles")
                .update({ mommy_lvl: level })
                .eq("id", session.user.id);

            if (error) {
                console.error('❌ Error updating mommy level:', error);
                return false;
            }

            setMommyLevel(level);
            console.log('✅ Successfully updated mommy level to:', level);
            return true;
        } catch (error) {
            console.error('❌ Exception updating mommy level:', error);
            return false;
        }
    };

    // Fetch mommy level when user session changes
    useEffect(() => {
        if (session?.user?.id) {
            fetchMommyLevel();
        } else {
            setMommyLevel(0);
        }
    }, [session?.user?.id]);

    const value: MommyLevelContextType = {
        mommyLevel,
        setMommyLevel,
        updateMommyLevel,
        refreshMommyLevel: fetchMommyLevel,
    };

    return (
        <MommyLevelContext.Provider value={value}>
            {children}
        </MommyLevelContext.Provider>
    );
};

export const useMommyLevel = (): MommyLevelContextType => {
    const context = useContext(MommyLevelContext);
    if (context === undefined) {
        throw new Error('useMommyLevel must be used within a MommyLevelProvider');
    }
    return context;
};

export default MommyLevelContext;
