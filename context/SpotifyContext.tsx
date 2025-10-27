import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { SpotifyUser } from '../types';
import * as spotifyService from '../services/spotifyService';
import { SupabaseContext } from './SupabaseContext';

interface SpotifyContextType {
    user: SpotifyUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: () => void;
    logout: () => void;
}

export const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const supabaseContext = useContext(SupabaseContext);
    const [user, setUser] = useState<SpotifyUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const handleRedirectCallback = useCallback(async (code: string, state: string | null) => {
        // Validate state parameter
        const storedState = window.sessionStorage.getItem('spotify_auth_state');
        if (state !== storedState) {
            console.error("State parameter mismatch - possible CSRF attack");
            window.sessionStorage.removeItem('spotify_auth_state');
            window.sessionStorage.removeItem('pkce_code_verifier');
            return;
        }

        try {
            const token = await spotifyService.getAccessToken(code);
            window.sessionStorage.setItem('spotify_access_token', token);
            setAccessToken(token);
            const profile = await spotifyService.getUserProfile(token);
            setUser(profile);
        } catch (error) {
            console.error("Spotify auth callback error:", error);
            // Clear bad token if any
            window.sessionStorage.removeItem('spotify_access_token');
            setAccessToken(null);
        } finally {
            // Clean up stored state and redirect
            window.sessionStorage.removeItem('spotify_auth_state');
            window.history.replaceState({}, '', window.location.pathname + (state || '#/'));
        }
    }, []);

    useEffect(() => {
        // Listen for Supabase auth changes to get Spotify tokens
        if (supabaseContext?.session?.provider_token) {
            setAccessToken(supabaseContext.session.provider_token);
            spotifyService.getUserProfile(supabaseContext.session.provider_token)
                .then(profile => {
                    setUser(profile);
                })
                .catch(error => {
                    console.error('Failed to fetch Spotify profile:', error);
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [supabaseContext?.session]);


    const login = async () => {
        const state = window.location.hash || '#/';
        await spotifyService.redirectToSpotifyAuth(state);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        window.sessionStorage.removeItem('spotify_access_token');
        window.sessionStorage.removeItem('pkce_code_verifier');
    };

    return (
        <SpotifyContext.Provider value={{
            user,
            accessToken,
            isAuthenticated: !!accessToken && !!user,
            loading,
            login,
            logout
        }}>
            {children}
        </SpotifyContext.Provider>
    );
};