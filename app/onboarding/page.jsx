'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signup');
    }
  }, [user, authLoading, router]);

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the profile in supabase that was auto-created during signup
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          // silhouette default from gravatar
          avatar_url: avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding');
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0107]">
            <div className="text-pink-500 text-xl font-bold animate-pulse">Loading...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0107] text-white font-sans p-4">
      <div className="max-w-md w-full bg-[#1c0816] rounded-2xl shadow-[0_0_30px_rgba(255,0,128,0.1)] p-8 border border-pink-900/30 text-center">
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
          Welcome to CupidSecure!
        </h1>
        <p className="text-gray-400 mb-8">Let's set up your profile to get started.</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleCompleteOnboarding} className="space-y-6 text-left">
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-[#2a0e22] border-2 border-pink-500 flex items-center justify-center overflow-hidden mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-pink-500/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            
            <label className="text-xs text-pink-400 hover:text-pink-300 cursor-pointer text-center w-full">
              Use custom avatar URL
              <input 
                type="text" 
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-2 w-full bg-[#110515] border border-pink-900/50 rounded p-2 text-white focus:outline-none focus:border-pink-500 text-xs"
              />
            </label>
            <p className="text-[10px] text-gray-500 mt-1 text-center w-full">Leave empty for default silhouette.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Display Name <span className="text-pink-500">*</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#2a0e22] border border-pink-900/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-500"
              placeholder="How should we call you?"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Saving...' : 'Get Started'}
          </button>
        </form>

      </div>
    </div>
  );
}
