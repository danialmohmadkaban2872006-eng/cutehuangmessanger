// © Danial Mohmad — All Rights Reserved
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Icon from "./ui/Icon";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { t, login, register, setPage } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (!isLogin && password !== confirmPassword) {
      toast.error(t.passwordMismatch); return;
    }
    if (!isLogin && !displayName.trim()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const ok = await login(email, password);
        if (!ok) toast.error(t.invalidCredentials);
      } else {
        const ok = await register(email, password, displayName);
        if (!ok) toast.error(t.emailTaken);
      }
    } catch {
      toast.error(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const input = (value: string, setter: (v: string) => void, placeholder: string, type = "text") => (
    <input
      type={type} value={value} onChange={e => setter(e.target.value)}
      placeholder={placeholder}
      onKeyDown={e => e.key === "Enter" && handleSubmit()}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 12,
        border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none",
        background: COLORS.surfaceDim, fontFamily: "inherit",
        transition: "border-color 0.2s",
      }}
      onFocus={e => (e.target.style.borderColor = COLORS.primary)}
      onBlur={e => (e.target.style.borderColor = COLORS.border)}
    />
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #FBF7F5 0%, #F0E8E4 100%)", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Back */}
        <button onClick={() => setPage("landing")} style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 28,
          background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
        }}>
          <Icon name="arrow" size={16} color={COLORS.textMuted} /> Back
        </button>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: "36px 32px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: `1px solid ${COLORS.border}`,
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="messageCircle" size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isLogin ? t.login : t.register}
            </h1>
            <p style={{ fontSize: 13, color: COLORS.textMuted }}>
              {isLogin ? t.noAccount : t.hasAccount}{" "}
              <span onClick={() => setIsLogin(!isLogin)} style={{ color: COLORS.primaryDark, cursor: "pointer", fontWeight: 600 }}>
                {isLogin ? t.register : t.login}
              </span>
            </p>
          </div>

          {/* Fields */}
          {!isLogin && input(displayName, setDisplayName, t.displayName)}
          {input(email, setEmail, t.email, "email")}
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.password}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "12px 44px 12px 14px", borderRadius: 12, marginBottom: 12,
                border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none",
                background: COLORS.surfaceDim, fontFamily: "inherit",
              }}
              onFocus={e => (e.target.style.borderColor = COLORS.primary)}
              onBlur={e => (e.target.style.borderColor = COLORS.border)}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", right: 12, top: 12, background: "none",
              border: "none", cursor: "pointer", color: COLORS.textMuted,
            }}>
              <Icon name={showPass ? "volumeX" : "volume"} size={16} color={COLORS.textMuted} />
            </button>
          </div>
          {!isLogin && input(confirmPassword, setConfirmPassword, t.confirmPassword, "password")}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: loading ? COLORS.primaryLight : `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4, transition: "all 0.2s",
          }}>
            {loading ? "..." : (isLogin ? t.login : t.register)}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: COLORS.textMuted }}>
            {t.rights}
          </div>
        </div>
      </div>
    </div>
  );
}
