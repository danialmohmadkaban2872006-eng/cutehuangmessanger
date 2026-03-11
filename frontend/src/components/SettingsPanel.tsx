// © Danial Mohmad — All Rights Reserved
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Icon from "./ui/Icon";
import Toggle from "./ui/Toggle";
import type { Language } from "../types";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ku", label: "Kurdish Sorani", native: "سۆرانی" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
];

export default function SettingsPanel() {
  const { t, theme, darkMode, setDarkMode, lang, setLang, logout } = useApp();

  const row = (icon: string, label: string, content: React.ReactNode) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(232,165,152,0.1)",
        }}>
          <Icon name={icon} size={18} color={COLORS.primary} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{label}</span>
      </div>
      {content}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, color: theme.text }}>{t.settings}</h2>

      {row("moon", t.darkMode, <Toggle value={darkMode} onChange={setDarkMode} />)}
      {row("globe", t.language, (
        <select
          value={lang}
          onChange={e => setLang(e.target.value as Language)}
          style={{
            padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${theme.border}`,
            background: theme.bg, color: theme.text, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
      ))}
      {row("messageCircle", t.notifications, <Toggle value={true} onChange={() => {}} />)}
      {row("lock", t.privacy, <span style={{ color: theme.textMuted }}>›</span>)}
      {row("shield", t.security, <span style={{ color: theme.textMuted }}>›</span>)}

      <div style={{ marginTop: 28 }}>
        <button onClick={logout} style={{
          width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${COLORS.error}`,
          background: "transparent", color: COLORS.error, fontWeight: 600, fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Icon name="x" size={16} color={COLORS.error} /> {t.logout}
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 32, color: theme.textMuted, fontSize: 12, lineHeight: 1.9 }}>
        <div style={{ fontWeight: 700, color: theme.text, marginBottom: 4 }}>Cute Huang Messenger</div>
        <div>Version 1.0.0</div>
        <div style={{ marginTop: 8 }}>{t.rights}</div>
        <div>Designed by Danial Mohmad</div>
      </div>
    </div>
  );
}
