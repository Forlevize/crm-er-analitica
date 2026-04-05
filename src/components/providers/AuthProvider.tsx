import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getDefaultRoute, getPermissions } from "@/lib/permissions";
import { mockUsers } from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppUser, Permissoes, UserRole } from "@/types";

interface AuthContextValue {
  session: Session | null;
  profile: AppUser | null;
  role: UserRole | null;
  permissions: Permissoes;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  defaultRoute: string;
}

const LOCAL_STORAGE_KEY = "er-analitica-dev-session";
const AuthContext = createContext<AuthContextValue | null>(null);

function getFallbackUser(email: string) {
  return mockUsers.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? mockUsers[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!isSupabaseConfigured || !supabase) {
        const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached && mounted) {
          setProfile(JSON.parse(cached) as AppUser);
        }
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(currentSession);

      if (currentSession?.user) {
        const { data } = await supabase.from("users").select("*").eq("id", currentSession.user.id).single();
        if (mounted) {
          setProfile((data as AppUser | null) ?? null);
        }
      }

      setIsLoading(false);
    }

    void bootstrap();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role ?? null;
  const permissions = useMemo(() => getPermissions(role), [role]);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured || !supabase) {
      void password;
      const nextProfile = getFallbackUser(email);
      setProfile(nextProfile);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextProfile));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
    setProfile((data as AppUser | null) ?? null);

    void supabase.rpc("registrar_log", {
      p_user_id: user.id,
      p_acao: "Login de usuario",
      p_tabela: "auth",
      p_registro_id: null,
      p_valor_anterior: null,
      p_valor_novo: { email },
    });
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      setProfile(null);
      setSession(null);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    setProfile(null);
    setSession(null);
  }

  async function requestPasswordReset(email: string) {
    if (!isSupabaseConfigured || !supabase) {
      void email;
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      throw error;
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      role,
      permissions,
      isLoading,
      signIn,
      signOut,
      requestPasswordReset,
      defaultRoute: getDefaultRoute(role),
    }),
    [isLoading, permissions, profile, role, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
