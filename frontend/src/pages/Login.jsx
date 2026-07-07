import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    const ok = await login(email, password);
    if (ok) navigate("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div className="card" style={{ width: 360, maxWidth: "100%", padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(22,48,43,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Building2 size={24} color="var(--ink)" />
          </div>
          <div className="page-title" style={{ fontSize: 20 }}>تسجيل الدخول</div>
          <div className="page-subtitle">نظام إدارة العقارات والإيجارات</div>
        </div>

        <div className="input-group">
          <label className="label">البريد الإلكتروني</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="input-group">
          <label className="label">كلمة المرور</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{ color: "var(--alert)", fontSize: 13, marginTop: 10 }}>{error}</div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 18 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "جاري الدخول..." : "دخول"}
        </button>
      </div>
    </div>
  );
}
