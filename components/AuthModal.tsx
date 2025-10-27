import React, { useState, useContext } from 'react';
import { SupabaseContext } from '../context/SupabaseContext';
import { SpotifyContext } from '../context/SpotifyContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const supabaseContext = useContext(SupabaseContext);
    const spotifyContext = useContext(SpotifyContext);
    if (!supabaseContext || !spotifyContext) return null;

    const { signIn, signUp } = supabaseContext;
    const { login: spotifyLogin } = spotifyContext;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const { error } = isLogin
            ? await signIn(email, password)
            : await signUp(email, password);

        if (error) {
            setError(error.message);
        } else {
            // After successful Supabase auth, trigger Spotify login
            await spotifyLogin();
            onClose();
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-400">
                        {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
                    </p>
                </div>

                <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                            isLogin ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                            !isLogin ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors text-white"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors text-white"
                            placeholder="Enter your password"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-colors text-white"
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-100 to-amber-200 text-gray-800 font-bold rounded-lg shadow-[0_0_5px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                {!isLogin && (
                    <p className="text-center text-sm text-gray-400 mt-4">
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
