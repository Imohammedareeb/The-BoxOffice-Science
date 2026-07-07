"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { type User, saveSession, loadSession, clearSession } from "@/lib/auth";
import { removeToken } from "@/lib/cookies";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(() => {
    const stored = loadSession();
    setUser(stored);
  }, []);

  useEffect(() => {
    // FIX-STALE-SESSION: loadSession() now checks token validity first
    const stored = loadSession();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback((newUser: User) => {
    saveSession(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    // SEC-06 FIX: removeToken() is now async — it calls POST /api/auth/logout
    // which clears the HttpOnly cookie server-side. Must await this.
    await removeToken();  // clears sessionStorage + calls server logout endpoint
    clearSession();       // clears localStorage bos_user
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
