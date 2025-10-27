import { SPOTIFY_CLIENT_ID, REDIRECT_URI } from "../config";
import { generatePkcePair } from "../utils/pkce";
import { Playlist, SpotifyUser, Track } from "../types";

const API_BASE = 'https://api.spotify.com/v1';
const ACCOUNTS_BASE = 'https://accounts.spotify.com';

export const redirectToSpotifyAuth = async (state: string) => {
    const { verifier, challenge } = await generatePkcePair();
    window.sessionStorage.setItem('pkce_code_verifier', verifier);
    window.sessionStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams();
    params.append("client_id", SPOTIFY_CLIENT_ID);
    params.append("response_type", "code");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("scope", "playlist-modify-public playlist-modify-private");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);
    params.append("state", state);

    document.location = `${ACCOUNTS_BASE}/authorize?${params.toString()}`;
};

export const getAccessToken = async (code: string): Promise<string> => {
    const verifier = window.sessionStorage.getItem('pkce_code_verifier');
    if (!verifier) {
        throw new Error("Code verifier not found in session storage.");
    }
    
    const params = new URLSearchParams();
    params.append("client_id", SPOTIFY_CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code_verifier", verifier);
    
    const result = await fetch(`${ACCOUNTS_BASE}/api/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });
    
    const { access_token } = await result.json();
    if (!access_token) {
        throw new Error("Failed to retrieve access token.");
    }
    return access_token;
};

const spotifyFetch = async (endpoint: string, token: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Spotify API request failed');
    }
    // Handle responses that might not have a body (e.g., 204 No Content)
    if (res.status === 204 || res.headers.get("content-length") === "0") {
        return null;
    }
    return res.json();
};

export const getUserProfile = (token: string): Promise<SpotifyUser> => {
    return spotifyFetch('/me', token);
}

const searchTrack = async (token: string, track: Track): Promise<string | null> => {
    const query = encodeURIComponent(`track:${track.title} artist:${track.artist}`);
    const result = await spotifyFetch(`/search?q=${query}&type=track&limit=1`, token);
    return result?.tracks?.items?.[0]?.uri ?? null;
}

export const createPlaylist = async (
    token: string, 
    userId: string, 
    playlist: Playlist
): Promise<{ id: string, external_urls: { spotify: string } }> => {
    return spotifyFetch(`/users/${userId}/playlists`, token, {
        method: 'POST',
        body: JSON.stringify({
            name: playlist.title,
            description: playlist.description,
            public: false
        })
    });
}

export const savePlaylistToSpotify = async (token: string, user: SpotifyUser, playlist: Playlist): Promise<string> => {
    // 1. Create the playlist
    const newPlaylist = await createPlaylist(token, user.id, playlist);

    // 2. Search for all tracks to get their URIs
    const trackUris = (await Promise.all(
        playlist.tracks.map(track => searchTrack(token, track))
    )).filter((uri): uri is string => uri !== null); // Filter out nulls and type guard

    if(trackUris.length === 0) {
        console.warn("No tracks were found on Spotify for this playlist.");
        return newPlaylist.external_urls.spotify;
    }

    // 3. Add tracks to the playlist
    // Spotify API recommends adding max 100 tracks at a time
    await spotifyFetch(`/playlists/${newPlaylist.id}/tracks`, token, {
        method: 'POST',
        body: JSON.stringify({
            uris: trackUris
        })
    });
    
    return newPlaylist.external_urls.spotify;
};