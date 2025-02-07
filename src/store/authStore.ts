import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  role: 'student' | 'teacher';
}

interface AuthState {
  user: User | null;
  sessionId: string | null;
  setUser: (user: User | null) => void;
  setSessionId: (sessionId: string | null) => void;
  login: (email: string, password: string, role: 'student' | 'teacher') => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string, role: 'student' | 'teacher') => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionId: null,
  setUser: (user) => set({ user }),
  setSessionId: (sessionId) => set({ sessionId }),

  login: async (email, password, role) => {
    try {
      // Clean up any existing session
      await supabase.auth.signOut();
      set({ user: null, sessionId: null });

      // Attempt to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!email.endsWith("@iiitl.ac.in")) {
        throw new Error("Only @iiitl.ac.in emails are allowed.");
      }

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Get user profile

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', authData.user.id)
        .single();
      
      // if (profileError) {
      //   throw new Error('Failed to fetch profile');
      // }

   console.log('Profile Data:', profile);
   
    console.log('Auth User ID:', authData.user.id);

      if (profileError) {
    console.error('Supabase Error:', profileError.message);
    throw new Error('Failed to fetch profile');
}
console.log('role:', profile.role);
      if (!profile) {
        throw new Error('Profile not found');
      }

      if (profile.role !== role) {
        console.log(profile.role)
        await supabase.auth.signOut();
        throw new Error(`Invalid role. Please use the correct login for ${role}s`);
      }

      // Create and set session
      const sessionId = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from('profiles')
        .update({ current_session: sessionId })
        .eq('id', authData.user.id);

      if (sessionError) {
        throw new Error('Failed to create session');
      }

      // Set user state
      set({
        user: {
          id: authData.user.id,
          username: profile.username,
          role: profile.role,
        },
        sessionId,
      });
    } catch (error) {
      // Clean up on error
      await supabase.auth.signOut();
      set({ user: null, sessionId: null });
      throw error;
    }
  },

  logout: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (user) {
        await supabase
          .from('profiles')
          .update({ current_session: null })
          .eq('id', user.id);
      }
    } finally {
      await supabase.auth.signOut();
      set({ user: null, sessionId: null });
    }
  },

  signup: async (email, password, username, role) => {
    try {
      // Clean up any existing session
      await supabase.auth.signOut();
      set({ user: null, sessionId: null });

      // Validate input
      if (!email?.trim()) throw new Error('Email is required');
      if (!password?.trim()) throw new Error('Password is required');
      if (!username?.trim()) throw new Error('Username is required');
      if (!role || !['student', 'teacher'].includes(role)) {
        throw new Error('Invalid role');
      }

      // Check if username is available
      const { data: isAvailable, error: checkError } = await supabase
        .rpc('check_username_available', { username_to_check: username });

      if (checkError) {
        throw new Error('Failed to check username availability');
      }

      if (!isAvailable) {
        throw new Error('Username already taken');
      }

      // Attempt to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            role,
          },
        },
      });

      if (!email.endsWith("@iiitl.ac.in")) {
        throw new Error("Only @iiitl.ac.in emails are allowed.");
      }
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Email already registered. Please login instead.');
        }
        throw signUpError;
      }

      // Return without setting user state - they need to login
      return;
    } catch (error) {
      // Clean up on error
      await supabase.auth.signOut();
      set({ user: null, sessionId: null });
      throw error;
    }
  },
}));