import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

type UserProfile = {
  username: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  selectedOption: string;
  userId?: number | null;
};

interface AuthContextType {
  user: UserProfile | null;
  login: (profile: UserProfile) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "authUser";
const SESSION_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hora

type StoredSession = {
  profile: UserProfile;
  expiresAt: number;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScheduledLogout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const logout = () => {
    clearScheduledLogout();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const scheduleLogout = (expiresAt: number) => {
    clearScheduledLogout();
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) {
      logout();
      return;
    }
    // setTimeout has a max delay (~24.8 days); 3h is safely within range
    timeoutRef.current = setTimeout(logout, msLeft);
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredSession = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setUser(parsed.profile);
          scheduleLogout(parsed.expiresAt);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    return () => clearScheduledLogout();
  }, []);

  const login = (profile: UserProfile) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const session: StoredSession = { profile, expiresAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(profile);
    scheduleLogout(expiresAt);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}