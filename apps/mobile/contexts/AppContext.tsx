import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AppContextType {
    loggedIn: boolean;
    session: Session | null;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType>({
    loggedIn: false,
    session: null,
    isLoading: true,
});

// Use a global variable to persist initialization state across re-mounts
let globalAuthState = {
    initialized: false,
    session: null as Session | null,
    isLoading: true,
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(globalAuthState.session);
    const [isLoading, setIsLoading] = useState(globalAuthState.isLoading);
    const mountedRef = useRef(true);
    const subscriptionRef = useRef<any>(null);

    useEffect(() => {
        mountedRef.current = true;
        console.log('🚀 AppProvider: Component mounted, checking global state:', {
            initialized: globalAuthState.initialized,
            hasSession: !!globalAuthState.session,
            isLoading: globalAuthState.isLoading
        });

        const initializeAuth = async () => {
            if (globalAuthState.initialized) {
                console.log('✅ AppProvider: Using cached auth state');
                if (mountedRef.current) {
                    setSession(globalAuthState.session);
                    setIsLoading(globalAuthState.isLoading);
                }
                return;
            }

            try {
                console.log('🔍 AppProvider: Fetching initial session...');
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ AppProvider: Error fetching initial session:', error);
                } else {
                    console.log('✅ AppProvider: Initial session fetched:', {
                        hasSession: !!initialSession,
                        userId: initialSession?.user?.id?.substring(0, 8) + '...' || 'none'
                    });
                }

                // Update global state
                globalAuthState.session = initialSession;
                globalAuthState.isLoading = false;
                globalAuthState.initialized = true;

                // Update component state if still mounted
                if (mountedRef.current) {
                    setSession(initialSession);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('❌ AppProvider: Error during auth initialization:', error);
                globalAuthState.isLoading = false;
                globalAuthState.initialized = true;

                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        // Initialize auth
        initializeAuth();

        // Set up auth state change listener (only once globally)
        if (!subscriptionRef.current) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
                console.log('🔔 AppProvider: Auth state change:', {
                    event,
                    hasSession: !!newSession,
                    userId: newSession?.user?.id?.substring(0, 8) + '...' || 'none'
                });

                // Update global state
                globalAuthState.session = newSession;

                // Update component state if mounted
                if (mountedRef.current) {
                    setSession(newSession);
                }
            });

            subscriptionRef.current = subscription;
            console.log('👂 AppProvider: Auth listener set up');
        }

        return () => {
            console.log('🧹 AppProvider: Component unmounting');
            mountedRef.current = false;
        };
    }, []); // Empty dependency array - run only once per mount

    // Clean up subscription when the last instance unmounts
    useEffect(() => {
        return () => {
            // This cleanup will only run when the component is truly unmounting
            setTimeout(() => {
                if (!mountedRef.current && subscriptionRef.current) {
                    console.log('🧹 AppProvider: Cleaning up auth subscription');
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                }
            }, 100);
        };
    }, []);

    const loggedIn = !!session;

    const contextValue = {
        loggedIn,
        session,
        isLoading,
    };

    console.log('🎭 AppProvider: Rendering with context:', {
        loggedIn,
        hasSession: !!session,
        isLoading,
        initialized: globalAuthState.initialized
    });

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    return context;
};