import React, { useState } from 'react';
import { auth } from '../services/auth';
import { User } from '../types';
import { Lock, Mail, ArrowRight, Github, Chrome, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Only for visual, logic uses email lookup in this mock
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
    }
    setLoading(true);
    setError('');
    
    // For demo: randomly decide if we ask for Password or OTP to show both features
    // In reality, this depends on user settings.
    setTimeout(() => {
        setLoading(false);
        // Default to OTP flow for "Modern" feel
        handleRequestOTP(); 
    }, 500);
  };

  // 2. Request OTP
  const handleRequestOTP = async () => {
      setLoading(true);
      const res = await auth.sendOTP(email);
      setLoading(false);
      if (res.success) {
          setView('otp');
          setError('');
      } else {
          setError(res.error || 'Failed to send code.');
      }
  };

  // 3. Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const res = await auth.verifyOTP(email, otp);
      setLoading(false);
      
      if (res.user) {
          onLogin(res.user);
      } else {
          setError(res.error || 'Invalid code.');
      }
  };

  // Social Login Mock
  const handleSocialLogin = async (provider: 'google' | 'github') => {
      setLoading(true);
      const res = await auth.socialLogin(provider);
      setLoading(false);
      onLogin(res.user);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1d21] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">nexus</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-2">
            {view === 'email' ? 'First, enter your email' : view === 'otp' ? 'Check your email' : 'Sign in to Nexus'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm text-lg">
            {view === 'email' && 'We suggest using the email address you use at work.'}
            {view === 'otp' && `We've sent a 6-digit code to ${email}. The code is likely in your developer console.`}
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-300">
        
        {view === 'email' && (
            <div className="space-y-4">
                <button onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white border-2 border-gray-200 dark:border-gray-200 text-gray-700 font-bold py-2.5 rounded hover:bg-gray-50 hover:shadow-sm transition-all text-[15px]">
                    <Chrome size={20} className="text-red-500" /> Sign in with Google
                </button>
                <button onClick={() => handleSocialLogin('github')} className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white font-bold py-2.5 rounded hover:bg-[#2f363d] hover:shadow-sm transition-all text-[15px]">
                    <Github size={20} /> Sign in with GitHub
                </button>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                <form onSubmit={handleEmailSubmit}>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@work-email.com"
                        className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none dark:bg-[#222529] dark:text-white transition-all"
                        disabled={loading}
                        autoFocus
                    />
                    {error && <p className="text-red-600 text-sm mt-2 flex items-center gap-1"><ShieldCheck size={14}/> {error}</p>}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-4 bg-[#4A154B] hover:bg-[#380e39] text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2 text-[15px]"
                    >
                        {loading ? 'Checking...' : 'Sign In with Email'}
                    </button>
                </form>
            </div>
        )}

        {view === 'otp' && (
            <div className="space-y-4">
                <div className="flex gap-2 justify-center mb-4">
                    {/* Mock visual for OTP digits */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-10 h-12 border-2 border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-[#222529] flex items-center justify-center">
                            {otp[i] || ''}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleVerifyOTP}>
                    <input 
                        type="text" 
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 text-center text-xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-md focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none dark:bg-[#222529] dark:text-white transition-all"
                        disabled={loading}
                        autoFocus
                    />
                    {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={loading || otp.length !== 6}
                        className="w-full mt-4 bg-[#4A154B] hover:bg-[#380e39] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
                
                <div className="text-center mt-4">
                    <button onClick={() => setView('email')} className="text-[#1264a3] hover:underline text-sm">
                        Use a different email
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-auto py-6 text-center">
          <p className="text-gray-400 text-xs max-w-md mx-auto">
              This is a secure environment. <Lock size={10} className="inline"/> End-to-end encryption enabled. 
              By proceeding, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="mt-2 text-xs text-gray-500">
              Try demo: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">alex@nexus.com</span>
          </div>
      </div>
    </div>
  );
};