import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onBack: () => void;
  darkMode: boolean;
}

export default function Auth({ onBack, darkMode }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.reload();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Tcheke imèl ou pou konfime enskripsyon an!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-10 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200'}`}>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Retounen
        </button>

        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">{isLogin ? 'Byenveni ankò!' : 'Kreye yon kont'}</h2>
          <p className="text-slate-500">{isLogin ? 'Konekte pou jere prezantasyon ou yo.' : 'Kòmanse sèvi ak BibSlide jodi a.'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700 mb-6">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 text-emerald-700 mb-6">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eg: pastè@legliz.com"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modpas</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
            {isLogin ? 'Konekte' : 'Enskri'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isLogin ? 'Ou pa gen kont? Enskri' : 'Ou gen yon kont deja? Konekte'}
          </button>
        </div>
      </div>
    </div>
  );
}
