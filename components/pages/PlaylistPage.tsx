import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistContext } from '../../context/PlaylistContext';
import { SpotifyContext } from '../../context/SpotifyContext';
import { SupabaseContext } from '../../context/SupabaseContext';
import { savePlaylistToSpotify } from '../../services/spotifyService';
import { LoadingSpinner, MusicIcon, PlayIcon, ShareIcon, EditIcon, RegenerateIcon, SpotifyIcon } from '../icons';

const LoadingScreen: React.FC = () => {
    const messages = ["Finding your vibe...", "Consulting the music cosmos...", "Curating tracks...", "Polishing the sequence...", "Almost there..."];
    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setMessage(messages[i]);
        }, 2000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white text-center">
            <LoadingSpinner className="w-12 h-12 mb-4" />
            <p className="text-xl">{message}</p>
        </div>
    );
};

const PlaylistPage: React.FC = () => {
    const playlistContext = useContext(PlaylistContext);
    const spotifyContext = useContext(SpotifyContext);
    const supabaseContext = useContext(SupabaseContext);
    const navigate = useNavigate();

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string>('');
    const [saveToSupabaseStatus, setSaveToSupabaseStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    if (!playlistContext || !spotifyContext || !supabaseContext) {
        throw new Error('PlaylistPage must be used within providers');
    }

    const { playlist, loading, error, generatePlaylist, lastGenerationDetails, savePlaylist } = playlistContext;
    const { isAuthenticated, user, accessToken, login } = spotifyContext;
    const { user: supabaseUser } = supabaseContext;

    useEffect(() => {
        if (!loading && !playlist) {
            navigate('/generate');
        }
    }, [loading, playlist, navigate]);

    const handleRegenerate = async () => {
        if (lastGenerationDetails) {
            setSaveStatus('idle'); // Reset save status on regenerate
            setSavedPlaylistUrl('');
            setSaveToSupabaseStatus('idle'); // Reset Supabase save status
            await generatePlaylist(lastGenerationDetails);
        }
    };

    const handleSaveToSupabase = async () => {
        if (!playlist || !lastGenerationDetails) return;

        setSaveToSupabaseStatus('saving');
        try {
            await savePlaylist(playlist, lastGenerationDetails);
            setSaveToSupabaseStatus('saved');
        } catch (err) {
            console.error('Failed to save playlist to Supabase:', err);
            setSaveToSupabaseStatus('error');
        }
    };

    const handleSaveToSpotify = async () => {
        if (!isAuthenticated || !accessToken || !user || !playlist) {
            login();
            return;
        }

        setSaveStatus('saving');
        try {
            const playlistUrl = await savePlaylistToSpotify(accessToken, user, playlist);
            setSavedPlaylistUrl(playlistUrl);
            setSaveStatus('saved');
        } catch (err) {
            console.error("Failed to save playlist to Spotify", err);
            setSaveStatus('error');
        }
    };
    
    const renderSaveButtonContent = () => {
        switch (saveStatus) {
            case 'idle':
                return <><SpotifyIcon className="w-6 h-6" /><span>{isAuthenticated ? 'Save to Spotify' : 'Connect Spotify to Save'}</span></>;
            case 'saving':
                return <><LoadingSpinner className="w-6 h-6" /><span>Saving...</span></>;
            case 'saved':
                return <><SpotifyIcon className="w-6 h-6" /><span>Saved! View on Spotify</span></>;
            case 'error':
                 return <><span>Error! Try Again</span></>;
        }
    }

    const renderSupabaseSaveButtonContent = () => {
        switch (saveToSupabaseStatus) {
            case 'idle':
                return <><span>Save to Account</span></>;
            case 'saving':
                return <><LoadingSpinner className="w-4 h-4" /><span>Saving...</span></>;
            case 'saved':
                return <><span>Saved!</span></>;
            case 'error':
                return <><span>Error! Try Again</span></>;
        }
    }


    if (loading) return <LoadingScreen />;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-400 text-xl">{error}</div>;
    if (!playlist) return null;

    return (
        <div className="min-h-screen text-white p-4 sm:p-8 pt-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-900/20 to-transparent -z-10"></div>

            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel - Playlist Info */}
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-fuchsia-500/20">
                        <img src={`https://picsum.photos/seed/${playlist.title}/500`} alt="Playlist Cover" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <button className="w-24 h-24 rounded-full bg-cyan-500/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg hover:bg-cyan-400/90 hover:scale-105 transition-transform">
                                <PlayIcon className="w-12 h-12" />
                            </button>
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-extrabold mt-6 tracking-tight">{playlist.title}</h1>
                    <p className="text-gray-300 mt-2">{playlist.description}</p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                        {playlist.tags.map(tag => (
                            <span key={tag} className="bg-white/10 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                    <div className="mt-4 text-gray-400 text-sm">
                        <span>{playlist.tracks.length} Tracks</span>
                        <span className="mx-2">•</span>
                        <span>Approx. {Math.round(playlist.tracks.length * 3.5)} min</span>
                    </div>
                    <div className="mt-8 flex flex-col gap-4">
                        <button
                            onClick={() => saveStatus === 'saved' ? window.open(savedPlaylistUrl, '_blank') : handleSaveToSpotify()}
                            disabled={saveStatus === 'saving'}
                            className="w-full max-w-sm lg:max-w-xs px-8 py-3 text-lg font-bold text-gray-800 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            {renderSaveButtonContent()}
                        </button>
                        <button
                            onClick={handleSaveToSupabase}
                            disabled={saveToSupabaseStatus === 'saving' || saveToSupabaseStatus === 'saved'}
                            className="w-full max-w-sm lg:max-w-xs px-8 py-3 text-lg font-bold text-gray-800 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            {renderSupabaseSaveButtonContent()}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Tracklist */}
                <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-[70vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4 p-2">Tracklist</h2>
                    <ul>
                        {playlist.tracks.map((track, index) => (
                            <li key={index} className="flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors group">
                                <div className="w-10 text-gray-400 text-center mr-4">{index + 1}</div>
                                <img src={`https://picsum.photos/seed/${track.title}${track.artist}/40`} alt={track.title} className="w-10 h-10 rounded-md mr-4"/>
                                <div className="flex-grow">
                                    <p className="font-semibold text-white">{track.title}</p>
                                    <p className="text-sm text-gray-400">{track.artist}</p>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayIcon className="w-6 h-6 text-gray-300 hover:text-white" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 p-4">
                <div className="container mx-auto flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-medium rounded-full hover:from-amber-200 hover:to-amber-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <button
                        onClick={() => navigate('/generate')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-medium rounded-full hover:from-amber-200 hover:to-amber-300 transition-colors"
                    >
                        <EditIcon className="w-5 h-5" />
                        Create New
                    </button>
                    <button
                        onClick={handleRegenerate}
                        disabled={!lastGenerationDetails || loading}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-medium rounded-full hover:from-amber-200 hover:to-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RegenerateIcon className="w-5 h-5" />
                        Regenerate
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-medium rounded-full hover:from-amber-200 hover:to-amber-300 transition-colors">
                        <ShareIcon className="w-5 h-5" />
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaylistPage;
