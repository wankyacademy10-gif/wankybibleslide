import React, { useState } from 'react';
import { Copy, ExternalLink, Palette, Share2, Mail, Link as LinkIcon, Check } from 'lucide-react';

interface CanvaIntegrationProps {
  currentText: string;
  darkMode: boolean;
}

export default function CanvaIntegration({ currentText, darkMode }: CanvaIntegrationProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const canvaUrl = "https://www.canva.com/design/DAHCG2LObZc/edit";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    // Optional: Add a toast notification here
  };

  const handleEditInCanva = () => {
    window.open(canvaUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Gade vèsè sa a sou BibSlide: \n\n${currentText}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Vèsè Biblik - BibSlide");
    const body = encodeURIComponent(currentText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!currentText) return null;

  return (
    <div className={`mt-8 p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-indigo-50/50 border-indigo-100'}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
              Design your slide in Canva
            </h3>
          </div>
        </div>

        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          You can copy your text and paste it inside the Canva template to customize your slide with your church design.
        </p>

        <div className="relative group">
          <textarea
            readOnly
            value={currentText}
            className={`w-full h-24 p-4 rounded-2xl text-sm font-medium resize-none outline-none transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-300' 
                : 'bg-white border-indigo-100 text-slate-700'
            } border group-hover:border-indigo-300`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent pointer-events-none rounded-2xl group-hover:from-indigo-500/5 transition-all" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
              darkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            📋 Copy Verse Text
          </button>
          
          <button
            onClick={handleEditInCanva}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            🎨 Edit in Canva
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Pataje:</span>
          <button
            onClick={handleWhatsAppShare}
            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
            title="Pataje sou WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleEmailShare}
            className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-all"
            title="Voye pa Imèl"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className={`p-2 rounded-xl transition-all ${copiedLink ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20'}`}
            title="Kopye lyen an"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
