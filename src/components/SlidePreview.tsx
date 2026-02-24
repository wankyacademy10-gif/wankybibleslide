import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Volume2, Clock, Square } from 'lucide-react';

interface SlidePreviewProps {
  slides: string[];
  current: number;
  setCurrent: (index: number | ((prev: number) => number)) => void;
  options: {
    font: string;
    fontSize: number;
    bgColor: string;
    brightness: number;
    textColor?: string;
    bgImage?: string | null;
  };
  darkMode: boolean;
}

export default function SlidePreview({ slides = [], current, setCurrent, options, darkMode }: SlidePreviewProps) {
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTTS = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(slides[current]);
      // Detect language or default to French/Kreyol
      utterance.lang = 'fr-FR'; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleBlackScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBlackScreen(!isBlackScreen);
  };

  if (!slides.length) {
    return (
      <div className={`text-center mt-8 p-12 border-2 border-dashed rounded-3xl transition-colors ${darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'} italic`}>
        👀 Preview will appear here once you add text or generate verses.
      </div>
    );
  }

  const { font = "Arial", fontSize = 32, bgColor = "#ffffff", brightness = 100, textColor: customTextColor, bgImage = null } = options;

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * (percent - 100));
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const bg = adjustBrightness(bgColor, brightness);
  const isDarkBg = brightness < 50 || (parseInt(bgColor.replace('#', ''), 16) < 0x888888 && brightness < 80);
  const calculatedTextColor = isDarkBg ? '#FFFFFF' : '#000000';
  const textColor = customTextColor || calculatedTextColor;

  const enterFullScreen = () => {
    if (previewRef.current) {
      if (previewRef.current.requestFullscreen) {
        previewRef.current.requestFullscreen();
        setIsTimerActive(true);
        setTimer(0);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTimerActive(false);
        setIsBlackScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="mt-8 text-center space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            🎞️ Live Preview
          </h3>
          <button
            onClick={handleTTS}
            className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title="Li vèsè a"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        {slides.length > 0 && (
          <button
            onClick={enterFullScreen}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Maximize2 className="w-4 h-4" /> Present
          </button>
        )}
      </div>
      
      <div 
        ref={previewRef}
        className={`relative mx-auto rounded-[2.5rem] shadow-2xl border-8 transition-all overflow-hidden w-full max-w-3xl aspect-video flex items-center justify-center ${darkMode ? 'border-slate-800' : 'border-white'} ${isBlackScreen ? 'bg-black !bg-none' : ''}`}
        style={{
          backgroundColor: isBlackScreen ? '#000000' : bg,
          backgroundImage: !isBlackScreen && bgImage ? `url(${bgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: isBlackScreen ? '#000000' : textColor,
          fontFamily: font,
          fontSize: `${fontSize}px`,
          textAlign: "center",
        }}
      >
        {/* Black Screen Overlay */}
        {isBlackScreen && <div className="absolute inset-0 bg-black z-[100]" />}

        {/* Overlay for brightness when image is present */}
        {!isBlackScreen && bgImage && (
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              backgroundColor: 'black', 
              opacity: (100 - brightness) / 100 
            }} 
          />
        )}

        <div className="relative z-10 px-16 py-8 leading-snug whitespace-pre-wrap">
          {slides[current]}
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-all active:scale-90 ${isDarkBg ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-all active:scale-90 ${isDarkBg ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Slide Counter Overlay */}
        <div className={`absolute bottom-4 right-6 text-[10px] font-bold uppercase tracking-widest opacity-40 ${isDarkBg ? 'text-white' : 'text-black'} ${isBlackScreen ? 'hidden' : ''}`}>
          Slide {current + 1} / {slides.length}
        </div>

        {/* Fullscreen Controls */}
        <div className="absolute bottom-4 left-6 flex items-center gap-4 z-[110] opacity-0 hover:opacity-100 transition-opacity">
          {isTimerActive && (
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-mono">
              <Clock className="w-3 h-3" />
              {formatTime(timer)}
            </div>
          )}
          <button
            onClick={toggleBlackScreen}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${isBlackScreen ? 'bg-white text-black' : 'bg-black/50 text-white'}`}
            title="Black Screen (B)"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5">
        {slides.length > 1 && slides.length <= 20 && slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} 
          />
        ))}
      </div>
    </div>
  );
}
