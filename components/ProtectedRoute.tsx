import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { SupabaseContext } from '../context/SupabaseContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const supabaseContext = useContext(SupabaseContext);
    const [showAuthModal, setShowAuthModal] = React.useState(false);

    if (!supabaseContext) {
        return <Navigate to="/" replace />;
    }

    const { user, loading } = supabaseContext;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <div className="flex flex-col items-center justify-center min-h-screen text-white text-center p-4">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold mb-4">Authentication Required</h1>
                        <p className="text-gray-400 mb-8">
                            You need to sign in to access playlist generation features and save your playlists.
                        </p>
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-fuchsia-600 to-cyan-500 rounded-full shadow-[0_0_20px_theme(colors.fuchsia.600),0_0_20px_theme(colors.cyan.500)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_theme(colors.fuchsia.500),0_0_30px_theme(colors.cyan.400)]"
                        >
                            Sign In / Sign Up
                        </button>
                    </div>
                </div>
                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            </>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
