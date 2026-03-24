import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthStore } from "@/lib/storage";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = AuthStore.getCurrent();
    setUser(current);
    setLoading(false);
  }, []);

  function login(email: string, password: string) {
    const result = AuthStore.login(email, password);
    if (result.ok) setUser(AuthStore.getCurrent());
    return result;
  }

  function register(name: string, email: string, password: string) {
    const result = AuthStore.register(name, email, password, "user");
    if (result.ok) setUser(AuthStore.getCurrent());
    return result;
  }

  function logout() {
    AuthStore.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === "admin", login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
