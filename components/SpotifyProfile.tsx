import React, { useContext, useEffect, useState } from 'react';
import { SupabaseContext } from '../context/SupabaseContext';

interface SpotifyProfileData {
    display_name: string;
    images: { url: string }[];
}

const SpotifyProfile: React.FC = () => {
    const supabaseContext = useContext(SupabaseContext);
    const [profile, setProfile] = useState<SpotifyProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    if (!supabaseContext) {
        return <div>Error: Supabase context not available</div>;
    }

    const { session } = supabaseContext;

    useEffect(() => {
        const fetchSpotifyProfile = async () => {
            if (!session?.provider_token) {
                setLoading(false);
                return;
            }

            try {
                // Fetch Spotify profile using the access token from Supabase session
                const response = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': `Bearer ${session.provider_token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch Spotify profile');
                }

                const profileData: SpotifyProfileData = await response.json();
                setProfile(profileData);
            } catch (err) {
                setError('Failed to load Spotify profile');
                console.error('Error fetching Spotify profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpotifyProfile();
    }, [session]);

    if (loading) {
        return <div className="text-sm text-gray-400">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-lg p-2">
                {error}
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {profile.images && profile.images[0] && (
                <img
                    src={profile.images[0].url}
                    alt={profile.display_name}
                    className="w-8 h-8 rounded-full"
                />
            )}
            <span className="font-medium text-white">{profile.display_name}</span>
        </div>
    );
};

export default SpotifyProfile;
