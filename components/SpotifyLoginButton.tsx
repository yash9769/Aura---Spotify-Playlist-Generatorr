import React, { useContext, useState } from 'react';
import { SupabaseContext } from '../context/SupabaseContext';
import { SpotifyContext } from '../context/SpotifyContext';
import { SpotifyIcon } from './icons';

const SpotifyLoginButton: React.FC = () => {
    const supabaseContext = useContext(SupabaseContext);
    const spotifyContext = useContext(SpotifyContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!supabaseContext || !spotifyContext) {
        return <div>Error: Context not available</div>;
    }

    const { signInWithSpotify } = supabaseContext;
    const { isAuthenticated, logout } = spotifyContext;

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await signInWithSpotify();
            if (error) {
                setError(error.message);
            }
            // Note: Supabase will handle the redirect automatically
        } catch (err) {
            setError('An unexpected error occurred during login');
            console.error('Spotify login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleLogin}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-bold text-sm px-4 py-2 rounded-full hover:from-amber-200 hover:to-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SpotifyIcon className="w-5 h-5" />
                {loading ? 'Connecting...' : isAuthenticated ? 'Switch Spotify Account' : 'Connect with Spotify'}
            </button>
            {error && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-lg p-2 max-w-xs">
                    {error}
                </div>
            )}
        </div>
    );
};

export default SpotifyLoginButton;
