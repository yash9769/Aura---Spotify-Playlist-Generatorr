
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '../icons';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen text-white text-center p-4 pt-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)]"></div>
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-fuchsia-600/20 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-600/20 rounded-full filter blur-3xl opacity-30 animate-pulse delay-2000"></div>

      <main className="z-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
          Your emotions, memories, and world —
        </h1>
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-br from-fuchsia-400 to-cyan-400">
          turned into music.
        </h2>

        <button
          onClick={() => navigate('/generate')}
          className="mt-10 px-8 py-4 text-lg font-bold text-gray-800 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center gap-2">
            <SparklesIcon />
            <span>Generate My Playlist</span>
          </div>
        </button>
      </main>
    </div>
  );
};

export default HomePage;
