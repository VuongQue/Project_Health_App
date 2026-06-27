import { useState } from "react";
import { login as loginApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
  
    console.log("👉 SUBMIT LOGIN");
    console.log("email:", email);
    console.log("password:", password);
  
    try {
      const res = await loginApi(email, password);
  
      console.log("✅ LOGIN RESPONSE:", res);
  
      auth.login(res.accessToken, res.user);
      console.log("✅ SAVE AUTH OK");
  
      nav("/");
      console.log("➡️ NAVIGATE /");
    } catch (err: any) {
      console.error("❌ LOGIN ERROR:", err);
      console.error("❌ ERROR RESPONSE:", err?.response);
  
      setError(
        err?.response?.data?.message ||
        "Sai email hoặc mật khẩu"
      );
    }
  };
  

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h2 className="text-xl font-bold mb-6 text-center">
          HealthHub Admin
        </h2>

        {error && (
          <p className="text-red-500 mb-3 text-sm">{error}</p>
        )}

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-4 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-500 text-white py-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
