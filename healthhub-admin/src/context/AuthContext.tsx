import { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: number;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 INIT AUTH STATE
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const u = localStorage.getItem("user");
  
    if (token && u && u !== "undefined") {
      try {
        setAccessToken(token);
        setUser(JSON.parse(u));
      } catch (e) {
        console.error("❌ Parse user error", e);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      }
    }
  
    setLoading(false);
  }, []);
  

  const login = (token: string, user: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    setAccessToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    setAccessToken(null);
    setUser(null);

    window.location.href = "/login";
  };

  if (loading) return null; // hoặc spinner

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
