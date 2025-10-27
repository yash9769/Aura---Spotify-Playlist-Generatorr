import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, REDIRECT_URI } from '../config';

interface SupabaseContextType {
    supabase: SupabaseClient;
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signInWithSpotify: () => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [supabase] = useState(() => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error };
    };

    const signInWithSpotify = async () => {
        // Clear any existing Spotify session data before starting OAuth
        window.sessionStorage.removeItem('spotify_access_token');
        window.sessionStorage.removeItem('pkce_code_verifier');
        window.sessionStorage.removeItem('spotify_auth_state');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'spotify',
            options: {
                redirectTo: REDIRECT_URI,
                scopes: 'playlist-modify-public playlist-modify-private user-read-email user-read-private',
                queryParams: {
                    prompt: 'select_account', // Force Spotify to show account selection screen
                },
            },
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <SupabaseContext.Provider value={{
            supabase,
            user,
            session,
            loading,
            signIn,
            signUp,
            signInWithSpotify,
            signOut,
        }}>
            {children}
        </SupabaseContext.Provider>
    );
};
