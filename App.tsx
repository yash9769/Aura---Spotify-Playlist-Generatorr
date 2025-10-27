import React, { useContext } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import GeneratePage from './components/pages/GeneratePage';
import PlaylistPage from './components/pages/PlaylistPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import SpotifyLoginButton from './components/SpotifyLoginButton';
import SpotifyProfile from './components/SpotifyProfile';
import { PlaylistProvider } from './context/PlaylistContext';
import { SpotifyProvider, SpotifyContext } from './context/SpotifyContext';
import { SupabaseProvider, SupabaseContext } from './context/SupabaseContext';
import { Logo, SpotifyIcon } from './components/icons';

// SpotifyConnect component is now replaced by SpotifyLoginButton and SpotifyProfile


const Header: React.FC = () => {
    const location = useLocation();
    const supabaseContext = useContext(SupabaseContext);
    const [showAuthModal, setShowAuthModal] = React.useState(false);

    // Don't show header on the homepage
    if (location.pathname === '/') {
        return null;
    }

    const { user, signOut } = supabaseContext || {};

    return (
        <>
            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                <Logo />
                <div className="flex items-center gap-4">
                    <SpotifyLoginButton />
                    {user ? (
                        <div className="flex items-center gap-4">
                            <SpotifyProfile />
                            <span className="text-white text-sm">{user.email}</span>
                            <button
                                onClick={signOut}
                                className="text-gray-300 hover:text-white transition-colors text-sm underline"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="text-gray-300 hover:text-white transition-colors text-sm underline"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </header>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    );
}

const App: React.FC = () => {
  const BackgroundComponent: React.FC = () => {
    const location = useLocation();
    if (location.pathname !== '/') return null;
    return <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/components/images/image.png)'}}></div>;
  };

  return (
    <SupabaseProvider>
      <SpotifyProvider>
        <PlaylistProvider>
          <HashRouter>
            <div className="min-h-screen font-sans relative overflow-hidden">
              <BackgroundComponent />
              <div className="absolute inset-0 bg-black/30"></div>
              <Header/>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/generate" element={<ProtectedRoute><GeneratePage /></ProtectedRoute>} />
                <Route path="/playlist" element={<ProtectedRoute><PlaylistPage /></ProtectedRoute>} />
              </Routes>
            </div>
          </HashRouter>
        </PlaylistProvider>
      </SpotifyProvider>
    </SupabaseProvider>
  );
};

export default App;
