import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.ts";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "../types/index.ts";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("uid", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;
        
        if (currentUser) {
          const newProfileData = {
            uid: currentUser.id,
            email: currentUser.email || "",
            display_name: currentUser.user_metadata.full_name || currentUser.email?.split('@')[0] || "",
            skill_score: 0,
            skill_level: "Beginner",
            topic_mastery: {},
            trust_weight: 1,
            integrity_score: 100,
            confidence_score: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from("users")
            .insert([newProfileData])
            .select()
            .single();
            
          if (!createError && createdProfile) {
            setProfile({
              uid: createdProfile.uid,
              email: createdProfile.email,
              displayName: createdProfile.display_name,
              skillScore: createdProfile.skill_score,
              skillLevel: createdProfile.skill_level,
              topicMastery: createdProfile.topic_mastery,
              trustWeight: createdProfile.trust_weight,
              integrityScore: createdProfile.integrity_score,
              confidenceScore: createdProfile.confidence_score,
              createdAt: createdProfile.created_at,
              updatedAt: createdProfile.updated_at,
            } as UserProfile);
          }
        }
      } else if (data) {
        setProfile({
          uid: data.uid,
          email: data.email,
          displayName: data.display_name,
          skillScore: data.skill_score,
          skillLevel: data.skill_level,
          topicMastery: data.topic_mastery,
          trustWeight: data.trust_weight,
          integrityScore: data.integrity_score,
          confidenceScore: data.confidence_score,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        } as UserProfile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
