// © Danial Mohmad — All Rights Reserved
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Icon from "./ui/Icon";

const LANGUAGES = [
  { code: "en", native: "EN" }, { code: "zh", native: "中文" },
  { code: "ar", native: "ع" }, { code: "ku", native: "کو" }, { code: "bn", native: "বা" },
];

export default function LandingPage() {
  const { t, setPage, lang, setLang } = useApp();

  const features = [
    { icon: "shield", title: t.featurePrivate, desc: t.featurePrivateDesc },
    { icon: "zap", title: t.featureRealtime, desc: t.featureRealtimeDesc },
    { icon: "lock", title: t.featureSecure, desc: t.featureSecureDesc },
    { icon: "globe", title: t.featureMultilingual, desc: t.featureMultilingualDesc },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F5", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="messageCircle" size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>{t.appName}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Language switcher */}
          <div style={{ display: "flex", gap: 4 }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code as never)} style={{
                padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                background: lang === l.code ? COLORS.primary : "transparent",
                color: lang === l.code ? "#fff" : COLORS.textMuted,
                fontWeight: lang === l.code ? 600 : 400,
              }}>{l.native}</button>
            ))}
          </div>
          <button onClick={() => setPage("auth")} style={{
            padding: "8px 20px", borderRadius: 20, border: `1.5px solid ${COLORS.primary}`,
            background: "transparent", color: COLORS.primaryDark, fontWeight: 600, cursor: "pointer",
            fontSize: 14, marginLeft: 8,
          }}>{t.signIn}</button>
          <button onClick={() => setPage("auth")} style={{
            padding: "8px 20px", borderRadius: 20, border: "none",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>{t.getStarted}</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 20px 60px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20,
          background: `rgba(232,165,152,0.12)`, color: COLORS.primaryDark,
          fontSize: 13, fontWeight: 600, marginBottom: 28,
        }}>
          <Icon name="zap" size={14} color={COLORS.primaryDark} /> {t.tagline}
        </div>
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 700, lineHeight: 1.15,
          letterSpacing: "-0.03em", color: "#1A1614", marginBottom: 20,
          fontFamily: "'Playfair Display', serif",
        }}>{t.heroTitle}</h1>
        <p style={{ fontSize: 18, color: COLORS.textMuted, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6 }}>
          {t.heroSubtitle}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("auth")} style={{
            padding: "14px 36px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
            boxShadow: `0 8px 30px ${COLORS.primary}50`,
          }}>{t.getStarted}</button>
          <button onClick={() => setPage("auth")} style={{
            padding: "14px 36px", borderRadius: 14, border: `1.5px solid ${COLORS.border}`,
            background: "#fff", color: COLORS.text, fontWeight: 600, fontSize: 16, cursor: "pointer",
          }}>{t.signIn}</button>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 16, padding: 24,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: `rgba(232,165,152,0.12)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={f.icon} size={22} color={COLORS.primary} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${COLORS.border}`, textAlign: "center",
        padding: "24px 20px", color: COLORS.textMuted, fontSize: 13,
      }}>
        {t.rights} &nbsp;·&nbsp; Designed with ❤️
      </footer>
    </div>
  );
}
