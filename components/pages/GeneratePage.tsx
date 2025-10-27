import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VIBES } from '../../constants';
import { PlaylistContext } from '../../context/PlaylistContext';
import { LoadingSpinner, SparklesIcon, EditIcon, CameraIcon, CloudIcon, TargetIcon, BrainIcon, ArrowLeftIcon, MicIcon, StopCircleIcon } from '../icons';
import { GenerationDetails } from '../../types';

type Mode = 'describe' | 'camera' | 'auto' | 'memory' | 'goal' | 'personality';

const PROMPT_BOILERPLATE = `You are AURA, an expert music curator AI. A user wants a playlist based on the following context. Create a unique, compelling playlist that matches this.
Generate the following:
1. A creative and fitting 'title' for the playlist.
2. A brief, evocative 'description' (1-2 sentences).
3. An array of 3-5 relevant string 'tags' (e.g., 'Synthwave', 'High Energy', 'Nostalgic').
4. A 'tracks' array of exactly 15 songs, each with a 'title' and 'artist'. Ensure the tracks are real and fit the vibe perfectly. Do not include song numbers.

CONTEXT:
`;


const GeneratePage: React.FC = () => {
    const [mode, setMode] = useState<Mode | null>(null);
    const [textInput, setTextInput] = useState('');
    const [selectedVibes, setSelectedVibes] = useState<Set<string>>(new Set());
    const [isListening, setIsListening] = useState(false);
    const [camStream, setCamStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);

    const navigate = useNavigate();
    const playlistContext = useContext(PlaylistContext);

    if (!playlistContext) {
        throw new Error('GeneratePage must be used within a PlaylistProvider');
    }

    const { generatePlaylist, loading, error, clearPlaylist } = playlistContext;

    // On mount, clear any previous playlist state.
    useEffect(() => {
        clearPlaylist();
    }, [clearPlaylist]);

    // Effect for handling camera stream
    useEffect(() => {
        if (camStream && videoRef.current) {
            videoRef.current.srcObject = camStream;
        }
        // Cleanup function for the camera stream
        return () => {
            camStream?.getTracks().forEach(track => track.stop());
        };
    }, [camStream]);

    // Effect for cleaning up speech recognition on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);


    const handleGeneration = async (details: GenerationDetails) => {
        const newPlaylist = await generatePlaylist(details);
        if (newPlaylist) {
            navigate('/playlist');
        }
    };
    
    // --- Text/Vibe/Speech Logic ---
    const handleVibeClick = (vibe: string) => {
        const newVibes = new Set(selectedVibes);
        newVibes.has(vibe) ? newVibes.delete(vibe) : newVibes.add(vibe);
        setSelectedVibes(newVibes);
    };

    const handleMicClick = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // Fix: Cast window to `any` to access browser-specific SpeechRecognition APIs.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
            setTextInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        
        setTextInput(''); // Clear previous text for a fresh recording
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
    };

    const handleTextSubmit = () => {
        let promptContext = '';
        if (mode === 'describe') {
            const finalVibe = [textInput, ...Array.from(selectedVibes)].filter(Boolean).join(', ');
            promptContext = `Vibe is: "${finalVibe}"`;
        } else if (mode === 'memory') {
            promptContext = `Memory is: "${textInput}"`;
        } else if (mode === 'goal') {
            promptContext = `Goal is: "${textInput}"`;
        } else if (mode === 'personality') {
            promptContext = `Personality is: "${textInput}"`;
        }
        if (!promptContext) return;
        handleGeneration({ type: 'text', prompt: PROMPT_BOILERPLATE + promptContext });
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCamStream(stream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
        }
    };
    
    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            // This will trigger the useEffect cleanup for camStream
            setCamStream(null);
        }
    };
    
    const handleImageSubmit = () => {
        if (!capturedImage) return;
        const base64Data = capturedImage.split(',')[1];
        handleGeneration({ type: 'image', imageData: base64Data });
    };

    // --- Auto Logic ---
    const handleAutoSubmit = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const promptContext = `Current time is ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}. Location is approximately latitude ${latitude}, longitude ${longitude}. Infer the likely weather and mood.`;
                handleGeneration({ type: 'text', prompt: PROMPT_BOILERPLATE + promptContext });
            },
            (err) => {
                console.error("Error getting location:", err);
                alert("Could not get location. Please check permissions.");
            }
        );
    };

    const resetState = () => {
        setMode(null);
        setTextInput('');
        setSelectedVibes(new Set());
        setCapturedImage(null);
        setCamStream(null);
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return <div className="flex flex-col items-center justify-center"><LoadingSpinner className="w-10 h-10" /> <p className="mt-4">Generating...</p></div>
        }
        if (mode === null) return <ModeSelection onSelect={setMode} />;

        const textModes = {
            describe: { title: "Describe Your Vibe", placeholder: "e.g., a rainy afternoon coding..." },
            memory: { title: "Describe a Memory", placeholder: "e.g., that summer trip to the coast..." },
            goal: { title: "What's Your Goal?", placeholder: "e.g., need to focus for 2 hours..." },
            personality: { title: "Describe Your Personality", placeholder: "e.g., introverted, loves fantasy books..." }
        };

        if (mode in textModes) {
            const { title, placeholder } = textModes[mode as keyof typeof textModes];
            const isDescribe = mode === 'describe';
            const canSubmit = textInput || (isDescribe && selectedVibes.size > 0);

            return (
                <>
                    <h2 className="text-4xl font-bold text-center mb-2">{title}</h2>
                    <p className="text-center text-gray-400 mb-6">{isDescribe ? "Describe your mood, what you're doing, or a memory..." : "The more detail, the better the playlist."}</p>
                    <div className="relative">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={isListening ? "Listening... speak your mind." : placeholder}
                            className={`w-full h-28 p-4 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all resize-none pr-12 ${isListening ? 'ring-2 ring-fuchsia-500/50 animate-pulse' : ''}`}
                        />
                        <button onClick={handleMicClick} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition">
                            {isListening ? <StopCircleIcon className="w-6 h-6 text-red-500"/> : <MicIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                    {isDescribe && (
                         <div className="my-6">
                            <p className="text-gray-300 mb-3 text-center">Or pick some vibes:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {VIBES.map((v) => (
                                    <button key={v} type="button" onClick={() => handleVibeClick(v)} className={`px-4 py-2 text-sm font-medium border rounded-full transition-all duration-200 ${selectedVibes.has(v) ? 'bg-fuchsia-500 border-fuchsia-500 text-white' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'}`}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <ActionButton text="Create Playlist" onClick={handleTextSubmit} disabled={!canSubmit} />
                </>
            );
        }
        
        if (mode === 'camera') {
            return (
                <>
                    <h2 className="text-4xl font-bold text-center mb-2">Detect from Camera</h2>
                    <div className="aspect-video w-full max-w-lg mx-auto bg-gray-900 rounded-lg overflow-hidden my-4 flex items-center justify-center">
                        {camStream && <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />}
                        {capturedImage && <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />}
                        {!camStream && !capturedImage && <p className="text-gray-400">Camera is off</p>}
                    </div>
                    {!capturedImage && !camStream && <ActionButton text="Start Camera" onClick={startCamera} />}
                    {camStream && <ActionButton text="Capture Mood" onClick={captureImage} />}
                    {capturedImage && <ActionButton text="Create from this image" onClick={handleImageSubmit} />}
                </>
            );
        }

        if (mode === 'auto') {
            return (
                <>
                    <h2 className="text-4xl font-bold text-center mb-2">Automatic Playlist</h2>
                    <p className="text-center text-gray-400 my-6">Let AURA create a playlist based on your local time and inferred weather. This will require location access.</p>
                    <ActionButton text="Generate Automatic Playlist" onClick={handleAutoSubmit} />
                </>
            );
        }

        return null;
    };


    return (
        <div className="flex items-center justify-center min-h-screen p-4 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)]"></div>
            <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-fuchsia-600/15 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-600/15 rounded-full filter blur-3xl opacity-30 animate-pulse delay-2000"></div>

            <div className="z-10 w-full max-w-2xl bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-fuchsia-500/10 transition-all duration-300">
                {mode && !loading && (
                    <button onClick={resetState} className="absolute top-4 left-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back
                    </button>
                )}
                {renderContent()}
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            </div>
        </div>
    );
};

const ActionButton: React.FC<{ text: string; onClick: () => void; disabled?: boolean }> = ({ text, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full mt-4 px-8 py-4 text-lg font-bold text-gray-800 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
    >
        <div className="flex items-center justify-center gap-3">
            <SparklesIcon />
            <span>{text}</span>
        </div>
    </button>
);

const ModeSelection: React.FC<{ onSelect: (mode: Mode) => void }> = ({ onSelect }) => {
    const modes = [
        { id: 'describe', icon: EditIcon, title: 'Describe Vibe', desc: 'Type or speak your feelings.' },
        { id: 'camera', icon: CameraIcon, title: 'From Camera', desc: 'Detect mood from your face.' },
        { id: 'auto', icon: CloudIcon, title: 'Automatic', desc: 'Use weather and time.' },
        { id: 'memory', icon: SparklesIcon, title: 'From a Memory', desc: 'Turn a memory into music.' },
        { id: 'goal', icon: TargetIcon, title: 'For a Goal', desc: 'Soundtrack for your tasks.' },
        { id: 'personality', icon: BrainIcon, title: 'My Personality', desc: 'Playlist for your character.' },
    ];

    return (
        <>
            <h2 className="text-4xl font-bold text-center mb-6">How do you want to create?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onSelect(mode.id as Mode)}
                        className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-left hover:bg-gray-700/50 hover:border-fuchsia-500/50 transition-all duration-200 flex flex-col items-start"
                    >
                        <mode.icon className="w-8 h-8 mb-3 text-cyan-400" />
                        <h3 className="font-bold text-lg text-white">{mode.title}</h3>
                        <p className="text-sm text-gray-400">{mode.desc}</p>
                    </button>
                ))}
            </div>
        </>
    );
};

export default GeneratePage;