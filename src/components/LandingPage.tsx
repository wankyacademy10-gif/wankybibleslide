import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Brain, 
  Presentation, 
  Moon, 
  Sun, 
  LogIn, 
  LogOut,
  ArrowRight,
  HeartHandshake,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: any;
}

export default function LandingPage({ onStart, onLogin, darkMode, setDarkMode, user }: LandingPageProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    { title: "Sòm 103:1", text: "Beni Seyè a, o nanm mwen! Se pou tout sa ki nan mwen beni non li ki sen!" },
    { title: "Jan 3:16", text: "Paske, Bondye sitèlman renmen lemonn, li bay sèl Pitit li a..." },
    { title: "Chant d’Espérance 17", text: "Mwen byen kontan Papa mwen nan syèl la, Pale nan liv li pou l di m li renmen m." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/X7j5bZCj/biblslide.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-black tracking-tighter text-indigo-600">BibSlide</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onStart}
                  className="hidden md:flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                >
                  <Layout className="w-4 h-4" /> Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 font-bold hover:underline"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[0.9]">
              Mete Pawòl la sou <span className="text-indigo-600">Ekran</span> san efò.
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              BibSlide ede legliz yo transfòme vèsè biblik ak chante an bèl prezantasyon PowerPoint nan kèk segonn.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onStart}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                Kòmanse Kounye a <ArrowRight className="w-5 h-5" />
              </button>
              <button className={`px-8 py-4 rounded-2xl font-bold text-lg border transition-all ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                Aprann Plis
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Animated Slide Preview */}
            <div className={`aspect-video rounded-[2.5rem] p-4 shadow-2xl transition-colors duration-500 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border-8`}>
              <div className="w-full h-full bg-indigo-900 rounded-[1.5rem] flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-3xl" />
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-6 z-10"
                  >
                    <h3 className="text-indigo-300 font-bold tracking-widest uppercase text-sm">BibSlide Preview</h3>
                    <p className="text-2xl md:text-3xl font-medium text-white leading-tight">
                      "{slides[slideIndex].text}"
                    </p>
                    <p className="text-indigo-400 font-bold text-lg">
                      — {slides[slideIndex].title}
                    </p>
                  </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 flex gap-2">
                  {slides.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === slideIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-24 px-6 transition-colors ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Fonksyon ki bay Legliz fòs</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Tout sa ou bezwen pou jere pwojeksyon pawòl la ak mizik la nan yon sèl kote.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Vèsè Biblik", desc: "Konvèti vèsè biblik yo an bèl slide PowerPoint nan yon bat je." },
              { icon: Brain, title: "AI & Mode Manuel", desc: "Sèvi ak Gemini AI pou chèche kontni oswa kole pwòp tèks ou." },
              { icon: Presentation, title: "Export PPTX & PDF", desc: "Telechaje fichye ki pare pou itilize sou nenpòt òdinatè." }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`p-10 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}
              >
                <div className="bg-indigo-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feat.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <HeartHandshake className="w-16 h-16 mx-auto text-indigo-200" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Soutni Misyon an 💝</h2>
            <p className="text-xl text-indigo-100 max-w-xl mx-auto">
              Donasyon ou ede nou kenbe BibSlide gratis pou tout legliz atravè mond lan.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://www.paypal.com/paypalme/wankym" 
                target="_blank"
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
              >
                Donate via PayPal
              </a>
              <a 
                href="https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b?locale=en" 
                target="_blank"
                className="bg-indigo-900/30 text-white border border-indigo-400/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-900/50 transition-all active:scale-95"
              >
                Donate via Stripe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/X7j5bZCj/biblslide.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tighter text-indigo-600">BibSlide</span>
          </div>
          
          <p className="text-slate-500 text-sm text-center md:text-left">
            © 2024 <strong>BibSlide</strong> — Zouti pou Legliz. <br className="md:hidden" />
            Powered by <strong>Wanky Massenat</strong>.
          </p>
          
          <div className="flex gap-6 text-sm font-bold">
            <a href="#" className="text-indigo-600 hover:underline">Kondisyon</a>
            <a href="#" className="text-indigo-600 hover:underline">Konfidansyalite</a>
            <a href="#" className="text-emerald-600 hover:underline">Donasyon 💝</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
