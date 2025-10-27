// IMPORTANT: In a real-world application, you would get this from a .env file
// For this example, replace it with your own Spotify Client ID.
export const SPOTIFY_CLIENT_ID = '88b6d014fab24f2f9463c2e28bca1371';

// Spotify Client Secret (used for server-side operations, but included for completeness)
export const SPOTIFY_CLIENT_SECRET = '[YOUR_CLIENT_SECRET]';

// This should match the Redirect URI you've set in your Spotify Developer Dashboard
// For local development, use: http://localhost:3000 (or your dev server port)
// For production, use your actual domain
export const REDIRECT_URI = 'https://iviyjeozlbvjhgqsjcyq.supabase.co/auth/v1/callback';

// Supabase configuration
export const SUPABASE_URL = 'https://iviyjeozlbvjhgqsjcyq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aXlqZW96bGJ2amhncXNqY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjE2OTYsImV4cCI6MjA3NzAzNzY5Nn0.K6AJOvjhf0wEoCtfo8XM1eOHIw_q4KVDnrCAXoc3egI';
