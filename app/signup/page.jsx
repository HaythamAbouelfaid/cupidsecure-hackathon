'use client'

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0107]">
            <div className="text-pink-500 text-xl font-bold animate-pulse">Loading...</div>
        </div>
    );
  }

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0107] text-white font-sans p-4">
      <div className="max-w-md w-full bg-[#1c0816] rounded-2xl shadow-[0_0_30px_rgba(255,0,128,0.1)] p-8 border border-pink-900/30">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center gap-2 cursor-pointer">
              CupidSecure
            </h1>
          </Link>
          <h2 className="mt-4 text-xl text-gray-300">Create your account</h2>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2a0e22] border border-pink-900/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a0e22] border border-pink-900/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
          <span className="text-xs text-center text-gray-400 uppercase">or</span>
          <span className="border-b border-gray-700 w-1/5 lg:w-1/4"></span>
        </div>

        <button
          onClick={signInWithGoogle}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/signin" className="text-pink-400 hover:text-pink-300 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
