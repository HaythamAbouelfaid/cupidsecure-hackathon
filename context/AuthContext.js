'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Automatically create profile and preferences rows on signup
      if (event === 'SIGNED_UP' && currentUser && currentUser.email) {
        try {
          // Insert profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: currentUser.id, 
              email: currentUser.email,
              display_name: null,
              avatar_url: null,
              created_at: new Date().toISOString()
            }, { onConflict: 'id' });
          
          if (profileError) console.error("Error auto-creating profile:", profileError);

          // Insert preferences record
          const { error: prefsError } = await supabase
            .from('preferences')
            .upsert({ 
              user_id: currentUser.id, 
              theme: 'dark' 
            }, { onConflict: 'user_id' });
          
          if (prefsError) console.error("Error auto-creating preferences:", prefsError);
        } catch (err) {
          console.error("Signup auto-creation exception:", err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`
      }
    });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signInWithGoogle, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
