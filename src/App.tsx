/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Settings, 
  BookOpen, 
  Layers, 
  Palette, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Music,
  Type,
  ClipboardPaste,
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import SlideOptions from './components/SlideOptions';
import SlidePreview from './components/SlidePreview';
import CanvaIntegration from './components/CanvaIntegration';
import bibleFallback from './bible_fallback.json';

interface Verse {
  number: number;
  text: string;
}

interface BibleData {
  book: string;
  chapter: number;
  verses: Verse[];
  language: string;
  source: string;
}

interface SongPart {
  part: string;
  lines: string[];
}

interface SongData {
  title: string;
  collection?: string;
  author?: string;
  language: string;
  license: string;
  lyrics: SongPart[];
}

const LANGUAGES = [
  { id: 'Kreyòl', label: 'Kreyòl' },
  { id: 'Français', label: 'Français' },
  { id: 'English', label: 'English' },
];

const THEMES = [
  { id: 'light', label: 'Kler', bg: 'bg-white', text: 'text-slate-900', accent: 'bg-indigo-600' },
  { id: 'dark', label: 'Somèb', bg: 'bg-slate-900', text: 'text-white', accent: 'bg-indigo-500' },
  { id: 'worship', label: 'Worship Blue', bg: 'bg-blue-900', text: 'text-blue-50', accent: 'bg-blue-400' },
  { id: 'nature', label: 'Nature Green', bg: 'bg-emerald-900', text: 'text-emerald-50', accent: 'bg-emerald-400' },
];

export default function App() {
  const [view, setView] = useState<'landing' | 'generator' | 'auth'>('landing');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [mode, setMode] = useState<'bible' | 'song' | 'paste' | 'theme'>('bible');
  const [useAI, setUseAI] = useState(false);
  const [reference, setReference] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pasteType, setPasteType] = useState<'bible' | 'song'>('bible');
  const [language, setLanguage] = useState('Kreyòl');
  const [loading, setLoading] = useState(false);
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [songData, setSongData] = useState<SongData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Slide Options
  const [versesPerSlide, setVersesPerSlide] = useState(1);
  const [linesPerSlide, setLinesPerSlide] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[1]);
  const [churchName, setChurchName] = useState('');

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const [slideStyle, setSlideStyle] = useState({
    font: "Arial",
    fontSize: 32,
    bgColor: "#ffffff",
    brightness: 100,
    textColor: "#000000",
    bgImage: null as string | null,
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

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

  const getSlidesForPreview = () => {
    if (mode === 'bible' && bibleData) {
      const grouped: string[] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        grouped.push(bibleData.verses.slice(i, i + versesPerSlide).map(v => `${v.number}. ${v.text}`).join('\n\n'));
      }
      return grouped;
    } else if (mode === 'song' && songData) {
      const allLines: string[] = [];
      songData.lyrics.forEach(part => {
        for (let i = 0; i < part.lines.length; i += linesPerSlide) {
          allLines.push(part.lines.slice(i, i + linesPerSlide).join('\n'));
        }
      });
      return allLines;
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;
      const grouped: string[] = [];
      for (let i = 0; i < lines.length; i += chunkSize) {
        grouped.push(lines.slice(i, i + chunkSize).join('\n'));
      }
      return grouped;
    }
    return [];
  };

  const previewSlides = getSlidesForPreview();

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [previewSlides.length]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setSlideStyle(data.preferences);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    }
  };

  const handleSaveDesign = async (options: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          preferences: options,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      alert("Design ou sove ak siksè! 🎉");
    } catch (err) {
      console.error("Error saving design:", err);
      alert("Gen yon erè ki rive lè n ap sove design ou.");
    }
  };

  const generateByTheme = async () => {
    if (!themeInput.trim()) return;
    setIsGeneratingTheme(true);
    setError(null);
    setBibleData(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 5 relevant Bible verses for the theme: "${themeInput}" in the language: ${language}. 
        Return the result as a JSON object with the following structure:
        {
          "book": "Tèm: ${themeInput}",
          "chapter": "AI Sijesyon",
          "verses": [
            {"number": 1, "text": "tèks vèsè a..."},
            ...
          ],
          "language": "${language}",
          "source": "AI Generated"
        }
        IMPORTANT: Format the text for professional slides. Use line breaks (\\n) for readability. 
        Highlight spiritual keywords like "Bondye", "Jezi", "Lavi", "Lafwa" by making them UPPERCASE if appropriate.
        Ensure the verses are accurate and from a public domain translation.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (!data.verses || data.verses.length === 0) {
        throw new Error("AI failed to generate verses. Please try a different theme.");
      }

      setBibleData(data);
      setMode('bible'); // Switch to bible mode to show results
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const processWithAI = async () => {
    if (!pastedText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to process text');
      }

      const data = await response.json();
      if (data.type === 'bible') {
        setBibleData(data);
        setMode('bible');
      } else if (data.type === 'song') {
        setSongData(data);
        setMode('song');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);
    setBibleData(null);
    setSongData(null);

    try {
      if (mode === 'bible') {
        // Offline Fallback Check
        if (!navigator.onLine && bibleFallback[reference as keyof typeof bibleFallback]) {
          const text = bibleFallback[reference as keyof typeof bibleFallback];
          setBibleData({
            book: reference.split(' ')[0],
            chapter: parseInt(reference.split(' ')[1]) || 1,
            verses: [{ number: 1, text }],
            language: 'Kreyòl',
            source: 'Offline Fallback'
          });
          setLoading(false);
          return;
        }

        const response = await fetch('/api/bible', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, language }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch verses');
        }

        const data = await response.json();
        setBibleData(data);
      } else {
        const response = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: reference, language }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch song lyrics');
        }

        const data = await response.json();
        setSongData(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePPTX = () => {
    if (!bibleData && !songData && !pastedText) return;

    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const themeColors = {
      light: { bg: 'FFFFFF', text: '1E293B', accent: '4F46E5' },
      dark: { bg: '0F172A', text: 'F8FAFC', accent: '6366F1' },
      worship: { bg: '1E3A8A', text: 'EFF6FF', accent: '60A5FA' },
      nature: { bg: '064E3B', text: 'ECFDF5', accent: '34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'worship' | 'nature'];

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness).replace('#', '');
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? 'FFFFFF' : '000000';
    const textColor = (slideStyle.textColor || calculatedTextColor).replace('#', '');

    if (mode === 'bible' && bibleData) {
      // ... existing bible logic ...
      const groupedVerses: Verse[][] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        groupedVerses.push(bibleData.verses.slice(i, i + versesPerSlide));
      }

      groupedVerses.forEach((group) => {
        const slide = pres.addSlide();
        if (slideStyle.bgImage) {
          slide.background = { data: slideStyle.bgImage };
          // Add overlay for brightness
          if (slideStyle.brightness < 100) {
            slide.addShape(pres.ShapeType.rect, {
              x: 0, y: 0, w: '100%', h: '100%',
              fill: { color: '000000', transparency: slideStyle.brightness }
            });
          }
        } else {
          slide.background = { color: adjustedBg };
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        const verseText = group.map(v => `${v.number}. ${v.text}`).join('\n\n');
        slide.addText(verseText, {
          x: 1, y: 1, w: '80%', h: '60%',
          fontSize: group.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });

        const refText = `${bibleData.book} ${bibleData.chapter}:${group[0].number}${group.length > 1 ? '-' + group[group.length - 1].number : ''}`;
        slide.addText(refText, {
          x: 0.5, y: 4.8, w: '90%',
          fontSize: 18,
          color: themeColors.accent,
          align: 'center',
          bold: true
        });
      });

      pres.writeFile({ fileName: `${bibleData.book}_${bibleData.chapter}.pptx` });
    } else if (mode === 'song' && songData) {
      // ... existing song logic ...
      let sTitle = pres.addSlide();
      if (slideStyle.bgImage) {
        sTitle.background = { data: slideStyle.bgImage };
        if (slideStyle.brightness < 100) {
          sTitle.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: slideStyle.brightness }
          });
        }
      } else {
        sTitle.background = { color: adjustedBg };
      }
      sTitle.addText(songData.title, { 
        x: 1, y: 2.5, w: '80%',
        fontSize: 44, bold: true, color: textColor, align: 'center', fontFace: slideStyle.font
      });
      if (songData.author) {
        sTitle.addText(`Otè: ${songData.author}`, { 
          x: 1, y: 4, w: '80%',
          fontSize: 18, italic: true, color: themeColors.accent, align: 'center' 
        });
      }

      songData.lyrics.forEach((partObj) => {
        const part = partObj.part || '';
        const lines = partObj.lines || [];

        for (let i = 0; i < lines.length; i += linesPerSlide) {
          const chunk = lines.slice(i, i + linesPerSlide);
          const slide = pres.addSlide();
          if (slideStyle.bgImage) {
            slide.background = { data: slideStyle.bgImage };
            if (slideStyle.brightness < 100) {
              slide.addShape(pres.ShapeType.rect, {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { color: '000000', transparency: slideStyle.brightness }
              });
            }
          } else {
            slide.background = { color: adjustedBg };
          }

          if (part) {
            slide.addText(part.toUpperCase(), { 
              x: 0.5, y: 0.3, w: '90%',
              fontSize: 14, color: themeColors.accent, bold: true 
            });
          }

          slide.addText(chunk.join("\n"), {
            x: 1, y: 1, w: '80%', h: '60%',
            fontSize: chunk.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
            color: textColor,
            align: "center",
            valign: "middle",
            fontFace: slideStyle.font
          });

          slide.addText(`${songData.title} — ${songData.author || ""}`, { 
            x: 0.5, y: 4.8, w: '90%',
            fontSize: 12, color: themeColors.accent, align: 'center' 
          });
        }
      });

      pres.writeFile({ fileName: `${songData.title.replace(/\s+/g, '_')}.pptx` });
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;
      
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const slide = pres.addSlide();
        if (slideStyle.bgImage) {
          slide.background = { data: slideStyle.bgImage };
          if (slideStyle.brightness < 100) {
            slide.addShape(pres.ShapeType.rect, {
              x: 0, y: 0, w: '100%', h: '100%',
              fill: { color: '000000', transparency: slideStyle.brightness }
            });
          }
        } else {
          slide.background = { color: adjustedBg };
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        slide.addText(chunk.join("\n"), {
          x: 1, y: 1, w: '80%', h: '60%',
          fontSize: chunk.length > 2 ? slideStyle.fontSize - 8 : slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });
      }
      pres.writeFile({ fileName: `BibSlide_Pasted.pptx` });
    }
  };

  const generatePDF = () => {
    if (!bibleData && !songData && !pastedText) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });

    const themeColors = {
      light: { bg: '#FFFFFF', text: '#1E293B', accent: '#4F46E5' },
      dark: { bg: '#0F172A', text: '#F8FAFC', accent: '#6366F1' },
      worship: { bg: '#1E3A8A', text: '#EFF6FF', accent: '#60A5FA' },
      nature: { bg: '#064E3B', text: '#ECFDF5', accent: '#34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'worship' | 'nature'];

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness);
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? '#FFFFFF' : '#000000';
    const textColor = slideStyle.textColor || calculatedTextColor;

    if (mode === 'bible' && bibleData) {
      // ... existing bible logic ...
      const groupedVerses: Verse[][] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        groupedVerses.push(bibleData.verses.slice(i, i + versesPerSlide));
      }

      groupedVerses.forEach((group, index) => {
        if (index > 0) doc.addPage([1280, 720], 'landscape');
        
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        doc.setTextColor(textColor);
        doc.setFont(slideStyle.font);
        const fontSize = group.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const verseText = group.map(v => `${v.number}. ${v.text}`).join('\n\n');
        const splitText = doc.splitTextToSize(verseText, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });

        const refText = `${bibleData.book} ${bibleData.chapter}:${group[0].number}${group.length > 1 ? '-' + group[group.length - 1].number : ''}`;
        doc.setFontSize(28);
        doc.setTextColor(themeColors.accent);
        doc.text(refText, 640, 680, { align: 'center' });
      });

      doc.save(`${bibleData.book}_${bibleData.chapter}.pdf`);
    } else if (mode === 'song' && songData) {
      // ... existing song logic ...
      if (slideStyle.bgImage) {
        doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
        if (slideStyle.brightness < 100) {
          doc.setFillColor(0, 0, 0);
          doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
          doc.rect(0, 0, 1280, 720, 'F');
          doc.setGState(new (doc as any).GState({ opacity: 1 }));
        }
      } else {
        doc.setFillColor(adjustedBg);
        doc.rect(0, 0, 1280, 720, 'F');
      }
      doc.setTextColor(textColor);
      doc.setFont(slideStyle.font);
      doc.setFontSize(64);
      doc.text(songData.title, 640, 300, { align: 'center' });
      if (songData.author) {
        doc.setFontSize(32);
        doc.setTextColor(themeColors.accent);
        doc.text(`Otè: ${songData.author}`, 640, 380, { align: 'center' });
      }

      songData.lyrics.forEach((partObj) => {
        const part = partObj.part || '';
        const lines = partObj.lines || [];

        for (let i = 0; i < lines.length; i += linesPerSlide) {
          const chunk = lines.slice(i, i + linesPerSlide);
          doc.addPage([1280, 720], 'landscape');
          if (slideStyle.bgImage) {
            doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
            if (slideStyle.brightness < 100) {
              doc.setFillColor(0, 0, 0);
              doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
              doc.rect(0, 0, 1280, 720, 'F');
              doc.setGState(new (doc as any).GState({ opacity: 1 }));
            }
          } else {
            doc.setFillColor(adjustedBg);
            doc.rect(0, 0, 1280, 720, 'F');
          }

          if (part) {
            doc.setFontSize(24);
            doc.setTextColor(themeColors.accent);
            doc.text(part.toUpperCase(), 40, 40);
          }

          doc.setTextColor(textColor);
          doc.setFont(slideStyle.font);
          const fontSize = chunk.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
          doc.setFontSize(fontSize);
          const verseText = chunk.join("\n");
          const splitText = doc.splitTextToSize(verseText, 1000);
          const textHeight = splitText.length * fontSize * 1.2;
          const yPos = (720 - textHeight) / 2 + fontSize;
          doc.text(splitText, 640, yPos, { align: 'center' });

          doc.setFontSize(20);
          doc.setTextColor(themeColors.accent);
          doc.text(`${songData.title} — ${songData.author || ""}`, 640, 680, { align: 'center' });
        }
      });

      doc.save(`${songData.title.replace(/\s+/g, '_')}.pdf`);
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        if (i > 0) doc.addPage([1280, 720], 'landscape');
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        doc.setTextColor(textColor);
        doc.setFont(slideStyle.font);
        const fontSize = chunk.length > 2 ? slideStyle.fontSize * 1.2 : slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const text = chunk.join("\n");
        const splitText = doc.splitTextToSize(text, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });
      }
      doc.save(`BibSlide_Pasted.pdf`);
    }
  };

  const generatePNG = async () => {
    const previewElement = document.querySelector('.slide-preview-container') as HTMLElement;
    if (previewElement) {
      try {
        const canvas = await html2canvas(previewElement, {
          useCORS: true,
          scale: 2,
        });
        const link = document.createElement('a');
        link.download = `BibSlide_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Error generating PNG:", err);
      }
    }
  };

  if (view === 'landing') {
    return (
      <LandingPage 
        onStart={() => setView('generator')} 
        onLogin={() => setView('auth')}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
      />
    );
  }

  if (view === 'auth') {
    return (
      <Auth 
        onBack={() => setView('landing')}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('landing')} className="p-1 hover:opacity-80 transition-opacity">
              <img 
                src="https://i.postimg.cc/X7j5bZCj/biblslide.png" 
                alt="BibSlide Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">BibSlide</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-50 border-slate-200 text-indigo-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setView('landing')}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Retounen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Mode Switcher */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setMode('bible'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'bible' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5" /> Bib
          </button>
          <button 
            onClick={() => { setMode('song'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'song' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Music className="w-5 h-5" /> Chante
          </button>
          <button 
            onClick={() => { setMode('paste'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'paste' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ClipboardPaste className="w-5 h-5" /> Kole
          </button>
          <button 
            onClick={() => { setMode('theme'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'theme' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-5 h-5" /> Tèm AI
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Config */}
          <div className="lg:col-span-1 space-y-6">
            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" /> {mode === 'bible' ? 'Rechèch Pasaj' : mode === 'song' ? 'Rechèch Chante' : mode === 'theme' ? 'Tèm AI' : 'Kole Tèks'}
              </h2>
              {mode === 'theme' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Ki tèm ou vle? (eg: Lapè, Lafwa, Renmen)</label>
                    <input 
                      type="text" 
                      value={themeInput}
                      onChange={(e) => setThemeInput(e.target.value)}
                      placeholder="Eg: Lapè nan kè..."
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                  <button 
                    onClick={generateByTheme}
                    disabled={isGeneratingTheme}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingTheme ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Jenere pa Tèm
                  </button>
                </div>
              ) : mode === 'paste' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-5 rounded-full transition-colors relative ${useAI ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={useAI} 
                          onChange={() => setUseAI(!useAI)} 
                        />
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useAI ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                        {useAI ? "Mode AI (Gemini)" : "Mode Manuel"}
                      </span>
                    </label>
                  </div>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={useAI ? "Egzanp: 1 Wa 21:1-7 an Kreyòl oswa kole yon chante..." : "Kole chante ou oswa pasaj Biblik la isit la..."}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                  {useAI ? (
                    <button 
                      onClick={processWithAI}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      Analize ak Gemini
                    </button>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPasteType('bible')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                            pasteType === 'bible' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Vèsè 📖
                        </button>
                        <button
                          onClick={() => setPasteType('song')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                            pasteType === 'song' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Chante 🎵
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={generatePPTX}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" /> PPTX
                        </button>
                        <button 
                          onClick={generatePDF}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" /> PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={fetchVerses} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {mode === 'bible' ? 'Referans (eg: 1 Wa 21:1-7)' : 'Tit oswa Nimewo (eg: 17 Chant d\'Espérance)'}
                    </label>
                      <input 
                        type="text" 
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={mode === 'bible' ? "Matye 5:1-12" : "Mwen byen kontan..."}
                        className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                      />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tradiksyon</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setLanguage(lang.id)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                            language === lang.id 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {mode === 'bible' ? 'Jwenn Vèsè yo' : 'Jwenn Chante a'}
                  </button>
                </form>
              )}
            </section>

            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Opsyon Slide
              </h2>
              <div className="space-y-4">
                {(mode === 'bible' || (mode === 'paste' && pasteType === 'bible')) ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Vèsè pa slide
                    </label>
                    <select 
                      value={versesPerSlide}
                      onChange={(e) => setVersesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 vèsè pa slide</option>
                      <option value={2}>2 vèsè pa slide</option>
                      <option value={3}>3 vèsè pa slide</option>
                      <option value={4}>4 vèsè pa slide</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3" /> Liy pa slide
                    </label>
                    <select 
                      value={linesPerSlide}
                      onChange={(e) => setLinesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 liy pa slide</option>
                      <option value={2}>2 liy pa slide</option>
                      <option value={3}>3 liy pa slide</option>
                      <option value={4}>4 liy pa slide</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Tèm Prezantasyon
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          selectedTheme.id === theme.id 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg ${theme.bg} border border-slate-200 mb-2`} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Non Legliz la (Opsyonèl)</label>
                  <input 
                    type="text" 
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Eglise de Dieu..."
                    className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>
            </section>

            <SlideOptions 
              onChange={setSlideStyle} 
              onSave={handleSaveDesign}
              darkMode={darkMode} 
              isLoggedIn={!!user}
            />
          </div>

          {/* Right Column: Preview & Download */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Erè nan rechèch la</p>
                    <p className="text-xs opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}

              {bibleData || songData || (mode === 'paste' && pastedText) ? (
                <motion.div 
                  key={mode === 'bible' ? "bible-results" : mode === 'song' ? "song-results" : "paste-results"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Preview Section */}
                  <div className={`p-8 rounded-3xl shadow-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {mode === 'bible' && bibleData ? `${bibleData.book} ${bibleData.chapter}` : mode === 'song' ? songData?.title : 'Aperçu Tèks'}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                          {mode === 'bible' && bibleData ? `${bibleData.source} • ${bibleData.language}` : mode === 'song' ? `${songData?.collection || 'Chante'} • ${songData?.language}` : 'Kole & Konvèti'}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={generatePPTX}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PPTX
                        </button>
                        <button 
                          onClick={generatePDF}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PDF
                        </button>
                        <button 
                          onClick={generatePNG}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                          <Image className="w-5 h-5" /> PNG
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {mode === 'bible' && bibleData ? (
                        bibleData.verses.map((verse, idx) => (
                          <div key={`${verse.number}-${idx}`} className={`group flex gap-4 p-4 rounded-2xl transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                            <span className="text-indigo-600 font-bold text-lg leading-none pt-1">{verse.number}</span>
                            <p className={`${darkMode ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>{verse.text}</p>
                          </div>
                        ))
                      ) : mode === 'song' && songData ? (
                        songData.lyrics.map((part, pIdx) => (
                          <div key={`part-${pIdx}`} className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{part.part}</h4>
                            <div className={`p-4 rounded-2xl space-y-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                              {part.lines.map((line, lIdx) => (
                                <p key={`line-${pIdx}-${lIdx}`} className={`${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{line}</p>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : mode === 'paste' && pastedText ? (
                        <div className={`p-6 rounded-2xl whitespace-pre-wrap leading-relaxed ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                          {pastedText}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="slide-preview-container">
                    <SlidePreview 
                      slides={previewSlides} 
                      current={currentSlideIndex}
                      setCurrent={setCurrentSlideIndex}
                      options={slideStyle} 
                      darkMode={darkMode} 
                    />
                  </div>

                  {/* Canva Integration Section */}
                  <CanvaIntegration 
                    currentText={previewSlides[currentSlideIndex] || ""} 
                    darkMode={darkMode} 
                  />
                </motion.div>
              ) : !loading && (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl"
                >
                  <div className="bg-slate-100 p-4 rounded-full">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-400">Pa gen anyen pou kounye a</h3>
                    <p className="text-sm text-slate-400 max-w-xs">Antre yon pasaj biblik nan bwat rechèch la pou kòmanse kreye slide ou yo.</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <div 
                  key="loading-state"
                  className="h-[400px] flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <BookOpen className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-indigo-600 font-medium animate-pulse">
                    {mode === 'bible' ? 'Gemini ap chèche vèsè yo...' : 'Gemini ap chèche chante a...'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className={`text-center py-10 border-t mt-12 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm">
            © 2024 <strong>BibSlide</strong> — Zouti pou Legliz.
          </p>
          <p className="text-xs mt-1">
            Powered by <strong>Wanky Massenat</strong>.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm font-medium flex-wrap">
            <button onClick={() => setShowTerms(true)} className="hover:underline text-indigo-600">Kondisyon</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:underline text-indigo-600">Konfidansyalite</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowDonation(true)} className="hover:underline text-emerald-600 font-bold">Donasyon 💝</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Kondisyon Itilizasyon – BibSlide">
        <TermsContent />
      </Modal>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Politik Konfidansyalite">
        <PrivacyContent />
      </Modal>

      <Modal isOpen={showDonation} onClose={() => setShowDonation(false)} title="Soutni BibSlide 🙏">
        <DonationContent />
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar text-slate-600 leading-relaxed">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const TermsContent = () => (
  <div className="space-y-6 text-sm sm:text-base">
    <section>
      <h4 className="font-bold text-slate-900 mb-2">1. Objektif platfòm nan</h4>
      <p>BibSlide se yon zouti kreye pa <strong>Wanky Massenat</strong> pou ede legliz, predikatè, ak moun k ap sèvi Bondye prezante vèsè biblik fasilman pandan sèvis, konferans, oswa etid biblik. Platfòm nan fèt pou sèvi kòm yon sipò teknik ak espirityèl — pa kòm yon zouti komèsyal.</p>
    </section>
    <section>
      <h4 className="font-bold text-slate-900 mb-2">2. Dwa itilizasyon</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Ou gen dwa sèvi ak BibSlide pou kreye prezantasyon pèsonèl oswa legliz ou.</li>
        <li>Ou <strong>pa gen dwa</strong> vann oswa redistribye aplikasyon an oswa fichye .pptx ki sòti ladan l kòm yon sèvis peye san pèmisyon ekriven an.</li>
        <li>Tout tèks biblik yo sòti nan tradiksyon piblik (Bib Kreyòl 1985, Louis Segond 1910, oswa King James Version) epi rete pwopriyete piblik.</li>
      </ul>
    </section>
    <section>
      <h4 className="font-bold text-slate-900 mb-2">3. Responsablite itilizatè a</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Itilizatè a responsab fason li itilize kontni an pandan sèvis oswa piblikasyon.</li>
        <li>BibSlide pa responsab pou okenn move itilizasyon oswa erè nan vèsè yo.</li>
        <li>Itilizatè a dwe respekte pawòl Bondye avèk respè ak entegrite.</li>
      </ul>
    </section>
    <section>
      <h4 className="font-bold text-slate-900 mb-2">4. Done ak vi prive</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>BibSlide <strong>pa kolekte okenn enfòmasyon pèsonèl</strong>.</li>
        <li>Tout jenerasyon kontni fèt atravè entèlijans atifisyèl (AI) ki ka itilize done biblik piblik.</li>
        <li>Pa gen done itilizatè ki estoke sou serveurs ekstèn san konsantman.</li>
      </ul>
    </section>
    <section>
      <h4 className="font-bold text-slate-900 mb-2">5. Modifikasyon kondisyon yo</h4>
      <p>Wanky Massenat gen dwa modifye kondisyon itilizasyon yo nenpòt moman pou amelyore sèvis la oswa ajoute nouvo fonksyon. Tout chanjman ap pibliye sou paj sa a.</p>
    </section>
    <section>
      <h4 className="font-bold text-slate-900 mb-2">6. Akseptasyon</h4>
      <p>Lè w itilize BibSlide, ou dakò ak tout kondisyon ki ekri nan dokiman sa a. Si ou pa dakò, tanpri sispann itilize platfòm nan.</p>
    </section>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-4 text-sm sm:text-base">
    <p>BibSlide respekte vi prive chak itilizatè.</p>
    <p>Nou pa kolekte, pa vann, e pa pataje okenn done pèsonèl. Tout operasyon fèt lokalman oswa atravè sèvis <strong>Gemini AI</strong> sèlman pou rekipere tèks biblik piblik.</p>
  </div>
);

const DonationContent = () => (
  <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
    <div className="text-center space-y-4">
      <p>
        BibSlide se yon zouti kreye pou ede legliz yo sèvi Bondye ak teknoloji.
        Chak don ou fè ede nou kontinye amelyore platfòm la, kenbe li gratis pou
        tout legliz, epi ajoute nouvo fonksyon tankou mizik ak prezantasyon biblik.
      </p>
    </div>

    <div className="space-y-4">
      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <span className="bg-indigo-100 p-1.5 rounded-lg">💳</span> Donasyon Elektwonik
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a 
          href="https://www.paypal.com/paypalme/wankym" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          PayPal
        </a>
        <a 
          href="https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b?locale=en&__embed_source=buy_btn_1SaoLdRpnzu1xmnI6UMOWfGF" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-indigo-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Stripe
        </a>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <span className="bg-emerald-100 p-1.5 rounded-lg">🏦</span> Transfè Bancaire
      </h4>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banreservas</p>
          <p className="text-slate-900 font-medium">Cuenta de Ahorro: <span className="font-bold text-indigo-600">960-469-7671</span></p>
          <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
        </div>
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banco BHD</p>
          <p className="text-slate-900 font-medium">Cuenta: <span className="font-bold text-indigo-600">36-475-68-0012</span></p>
          <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
        </div>
      </div>
    </div>

    <p className="mt-8 text-slate-500 italic text-center border-t border-slate-100 pt-6">
      “Bondye renmen moun ki bay ak kè kontan.” — 2 Korentyen 9:7
    </p>
  </div>
);
