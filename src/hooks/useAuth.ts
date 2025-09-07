import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<null | { id: string; email?: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email || undefined } : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(
        session?.user ? { id: session.user.id, email: session.user.email || undefined } : null,
      );
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string) => {
    await supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signInWithMagicLink, signOut };
};
