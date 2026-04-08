import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Login from "@/pages/Login";

interface AuthContextType {
  session: any;
  profile: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) console.error("Error al cargar perfil:", error);
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isPublicRoute = window.location.pathname.startsWith('/client/');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2A2B73]" />
        <p className="text-slate-500 font-medium mt-4">Verificando acceso seguro...</p>
      </div>
    );
  }

  if (!session && !isPublicRoute) return <Login />;

  return (
    <AuthContext.Provider value={{ session, profile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}