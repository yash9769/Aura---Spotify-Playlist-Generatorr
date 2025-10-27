export interface Track {
  title: string;
  artist: string;
}

export interface Playlist {
  title:string;
  description: string;
  tags: string[];
  tracks: Track[];
}

export type TextGenerationDetails = {
    type: 'text';
    prompt: string;
};
export type ImageGenerationDetails = {
    type: 'image';
    imageData: string; // base64
};
export type GenerationDetails = TextGenerationDetails | ImageGenerationDetails;

export interface SpotifyUser {
    id: string;
    display_name: string;
    images: { url: string }[];
}

export interface PersistedPlaylist {
    id: string;
    user_id: string;
    title: string;
    description: string;
    tags: string[];
    tracks: Track[];
    generation_details: GenerationDetails;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}
