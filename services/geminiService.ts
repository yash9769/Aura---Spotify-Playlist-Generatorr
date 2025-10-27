
import { GoogleGenAI, Type } from "@google/genai";
import { Playlist } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const playlistSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
        tracks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    artist: { type: Type.STRING },
                },
                required: ["title", "artist"],
            },
        },
    },
    required: ["title", "description", "tags", "tracks"],
};

const validatePlaylistData = (playlistData: any): playlistData is Playlist => {
    return (
        playlistData.title &&
        playlistData.description &&
        Array.isArray(playlistData.tags) &&
        Array.isArray(playlistData.tracks) &&
        playlistData.tracks.length > 0
    );
}

export const generatePlaylist = async (prompt: string): Promise<Playlist> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: playlistSchema,
            },
        });

        const jsonText = response.text.trim();
        const playlistData = JSON.parse(jsonText);

        if (!validatePlaylistData(playlistData)) {
            throw new Error("Invalid playlist structure received from API.");
        }

        return playlistData;
    } catch (error) {
        console.error("Error generating playlist from text:", error);
        throw new Error("Failed to generate playlist from text. The AI might be busy, please try again.");
    }
};


export const generatePlaylistFromImage = async (base64ImageData: string): Promise<Playlist> => {
    try {
        const prompt = `You are AURA, an expert music curator AI. Analyze the person's facial expression in this image and create a unique, compelling playlist that matches their likely mood.
Generate the following according to the schema:
1. A creative and fitting 'title' for the playlist.
2. A brief, evocative 'description' (1-2 sentences).
3. An array of 3-5 relevant string 'tags' (e.g., 'Synthwave', 'High Energy', 'Nostalgic').
4. A 'tracks' array of exactly 15 songs, each with a 'title' and 'artist'. Ensure the tracks are real and fit the mood perfectly. Do not include song numbers.`;

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64ImageData,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: playlistSchema,
            },
        });

        const jsonText = response.text.trim();
        const playlistData = JSON.parse(jsonText);

        if (!validatePlaylistData(playlistData)) {
            throw new Error("Invalid playlist structure received from API.");
        }

        return playlistData;
    } catch (error) {
        console.error("Error generating playlist from image:", error);
        throw new Error("Failed to generate playlist from image. The AI might be busy, please try again.");
    }
};
