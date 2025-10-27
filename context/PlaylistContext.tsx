
import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import { Playlist, GenerationDetails, PersistedPlaylist } from '../types';
import { SupabaseContext } from './SupabaseContext';
import * as geminiService from '../services/geminiService';

interface PlaylistContextType {
  playlist: Playlist | null;
  loading: boolean;
  error: string | null;
  lastGenerationDetails: GenerationDetails | null;
  savedPlaylists: PersistedPlaylist[];
  generatePlaylist: (details: GenerationDetails) => Promise<Playlist | null>;
  clearPlaylist: () => void;
  savePlaylist: (playlist: Playlist, generationDetails: GenerationDetails) => Promise<void>;
  loadSavedPlaylists: () => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
}

export const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerationDetails, setLastGenerationDetails] = useState<GenerationDetails | null>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<PersistedPlaylist[]>([]);

  const supabaseContext = useContext(SupabaseContext);
  const { user, supabase } = supabaseContext || {};

  const generatePlaylist = useCallback(async (details: GenerationDetails) => {
    setLoading(true);
    setError(null);
    setPlaylist(null);
    setLastGenerationDetails(details);

    try {
      let newPlaylist: Playlist;
      if (details.type === 'text') {
        newPlaylist = await geminiService.generatePlaylist(details.prompt);
      } else {
        newPlaylist = await geminiService.generatePlaylistFromImage(details.imageData);
      }
      setPlaylist(newPlaylist);
      setLoading(false);
      return newPlaylist;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setLoading(false);
      return null;
    }
  }, []);

  const clearPlaylist = useCallback(() => {
    setPlaylist(null);
    setError(null);
    setLastGenerationDetails(null);
  }, []);

  const savePlaylist = useCallback(async (playlistData: Playlist, generationDetails: GenerationDetails) => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          title: playlistData.title,
          description: playlistData.description,
          tags: playlistData.tags,
          tracks: playlistData.tracks,
          generation_details: generationDetails,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setSavedPlaylists(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error saving playlist:', err);
      throw err;
    }
  }, [user, supabase]);

  const loadSavedPlaylists = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedPlaylists(data || []);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  }, [user, supabase]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      // Remove from local state
      setSavedPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (err) {
      console.error('Error deleting playlist:', err);
      throw err;
    }
  }, [supabase]);

  // Load saved playlists when user changes
  useEffect(() => {
    if (user) {
      loadSavedPlaylists();
    } else {
      setSavedPlaylists([]);
    }
  }, [user, loadSavedPlaylists]);

  return (
    <PlaylistContext.Provider value={{
      playlist,
      loading,
      error,
      lastGenerationDetails,
      savedPlaylists,
      generatePlaylist,
      clearPlaylist,
      savePlaylist,
      loadSavedPlaylists,
      deletePlaylist
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};
