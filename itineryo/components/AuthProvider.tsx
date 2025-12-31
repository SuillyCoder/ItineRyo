'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log('📌 Session check:', session ? `Found (${session.user.email})` : 'None', error);
        setUser(session?.user ?? null);
        setInitialLoad(false);
      } catch (error) {
        console.error('Session check error:', error);
        setUser(null);
        setInitialLoad(false);
      } finally {
        if (mounted){
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return; 

      console.log('📌 Auth state changed:', event, session?.user?.email);

      setUser(session?.user ?? null);
      setLoading(false);

      // Force a router refresh on sign in/out
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('🔄 Refreshing page for:', event);
        router.refresh(); // ✅ Use Next.js router instead of window.location
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);