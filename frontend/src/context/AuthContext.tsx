import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'admin' | 'worker' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (username: string, role: Exclude<Role, null>) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (e) {
        console.error('Failed to parse auth from local storage', e);
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, role: Exclude<Role, null>) => {
    // Simple mock login - just create a user based on username and role
    const user = {
      id: `user_${Date.now()}`,
      email: `${username}@company.com`,
      name: username,
      role
    };
    const token = `token_${Date.now()}`;

    setUser(user);
    setToken(token);
    localStorage.setItem('auth', JSON.stringify({ user, token }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};