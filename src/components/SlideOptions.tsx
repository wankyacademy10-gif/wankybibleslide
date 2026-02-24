import React, { useState } from 'react';
import { Layout } from 'lucide-react';

interface SlideOptionsProps {
  onChange: (options: any) => void;
  onSave?: (options: any) => void;
  darkMode: boolean;
  isLoggedIn?: boolean;
}

export default function SlideOptions({ onChange, onSave, darkMode, isLoggedIn }: SlideOptionsProps) {
  const [font, setFont] = useState("Arial");
  const [fontSize, setFontSize] = useState(32);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [textColor, setTextColor] = useState("#000000");
  const [bgImage, setBgImage] = useState<string | null>(null);

  const updateOptions = (key: string, value: any) => {
    const newOptions = { font, fontSize, bgColor, brightness, textColor, bgImage, [key]: value };
    onChange(newOptions);
    if (key === "font") setFont(value);
    if (key === "fontSize") setFontSize(value);
    if (key === "bgColor") setBgColor(value);
    if (key === "brightness") setBrightness(value);
    if (key === "textColor") setTextColor(value);
    if (key === "bgImage") setBgImage(value);
  };

  const applyTemplate = (template: any) => {
    setFont(template.font);
    setFontSize(template.fontSize);
    setBgColor(template.bgColor);
    setBrightness(template.brightness);
    setTextColor(template.textColor);
    setBgImage(template.bgImage);
    onChange(template);
  };

  const templates = [
    { 
      name: "Bible Verse", 
      icon: "📖",
      font: "Times New Roman", fontSize: 36, bgColor: "#ffffff", brightness: 100, textColor: "#1e293b", bgImage: null 
    },
    { 
      name: "Song", 
      icon: "🎵",
      font: "Arial", fontSize: 32, bgColor: "#0f172a", brightness: 100, textColor: "#f8fafc", bgImage: null 
    },
    { 
      name: "Worship", 
      icon: "🙌",
      font: "Verdana", fontSize: 34, bgColor: "#1e3a8a", brightness: 80, textColor: "#ffffff", bgImage: "https://picsum.photos/seed/worship/1920/1080" 
    },
    { 
      name: "Teaching", 
      icon: "👨‍🏫",
      font: "Open Sans", fontSize: 30, bgColor: "#f8fafc", brightness: 100, textColor: "#334155", bgImage: null 
    }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateOptions("bgImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`mt-6 text-left p-6 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center gap-2">
        🎨 Slide Style Options
      </h3>

      {/* Templates Library */}
      <div className="mb-8">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layout className="w-3 h-3" /> Templates Library
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {templates.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-300' 
                  : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-700 shadow-sm'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoggedIn && (
        <button
          onClick={() => onSave?.({ font, fontSize, bgColor, brightness, textColor, bgImage })}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Layout className="w-4 h-4" /> Sove Design mwen
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Font Type */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Font</label>
          <select
            value={font}
            onChange={(e) => updateOptions("font", e.target.value)}
            className={`border p-3 rounded-xl outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Calibri</option>
            <option>Verdana</option>
            <option>Montserrat</option>
            <option>Poppins</option>
            <option>Open Sans</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Font Size ({fontSize}px)</label>
          <input
            type="range"
            min="24"
            max="64"
            step="2"
            value={fontSize}
            onChange={(e) => updateOptions("fontSize", parseInt(e.target.value))}
            className="accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Background Color */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Background Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => updateOptions("bgColor", e.target.value)}
              className="w-12 h-12 rounded-xl border-none cursor-pointer overflow-hidden"
            />
            <span className="text-sm font-mono uppercase">{bgColor}</span>
          </div>
        </div>

        {/* Text Color */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Text Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={textColor}
              onChange={(e) => updateOptions("textColor", e.target.value)}
              className="w-12 h-12 rounded-xl border-none cursor-pointer overflow-hidden"
            />
            <span className="text-sm font-mono uppercase">{textColor}</span>
          </div>
        </div>

        {/* Brightness */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Brightness ({brightness}%)</label>
          <input
            type="range"
            min="1"
            max="100"
            value={brightness}
            onChange={(e) => updateOptions("brightness", parseInt(e.target.value))}
            className="accent-yellow-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Background Image */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Background Image (Opsyonèl)</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={`flex-1 p-2 rounded-xl border text-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            />
            {bgImage && (
              <button 
                onClick={() => updateOptions("bgImage", null)}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Retire Imaj
              </button>
            )}
          </div>
          {bgImage && (
            <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden border border-slate-200">
              <img src={bgImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
