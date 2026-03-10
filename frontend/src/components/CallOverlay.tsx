// © Danial Mohmad — All Rights Reserved
import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";

export default function CallOverlay() {
  const { t, callState, setCallState } = useApp();
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [status, setStatus] = useState<"calling" | "connected">("calling");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setStatus("connected");
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }, 2500);
    return () => { clearTimeout(connectTimer); clearInterval(timerRef.current); };
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const endCall = () => { clearInterval(timerRef.current); setCallState(null); };
  const partner = callState?.partner;

  const controls = [
    { icon: muted ? "volumeX" : "mic", label: t.mute, action: () => setMuted(!muted), active: muted },
    { icon: "volume", label: t.speaker, action: () => setSpeakerOn(!speakerOn), active: !speakerOn },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "linear-gradient(160deg, #1a1614 0%, #2d1f1a 50%, #1a2025 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
    }}>
      {/* Pulsing rings */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[300, 250, 200].map((size, i) => (
          <div key={i} style={{
            position: "absolute", top: "28%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: size, height: size, borderRadius: "50%",
            border: `1px solid rgba(232,165,152,${0.15 - i * 0.04})`,
            animation: `ping 2s ease-in-out ${i * 0.4}s infinite`,
          }} />
        ))}
      </div>

      <div style={{ textAlign: "center", zIndex: 1, padding: "0 40px" }}>
        <Avatar user={partner} size={96} />
        <h2 style={{
          fontSize: 26, fontWeight: 700, marginTop: 20, marginBottom: 8,
          fontFamily: "'Playfair Display', serif",
        }}>{partner?.displayName}</h2>
        <p style={{ fontSize: 15, opacity: 0.6, marginBottom: 56 }}>
          {status === "calling" ? t.calling : fmt(callDuration)}
        </p>

        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 48 }}>
          {controls.map((btn, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button onClick={btn.action} style={{
                width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
                background: btn.active ? "rgba(232,165,152,0.3)" : "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={btn.icon} size={22} color="#fff" />
              </button>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{btn.label}</span>
            </div>
          ))}
        </div>

        <button onClick={endCall} style={{
          width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer",
          background: COLORS.error, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 30px ${COLORS.error}60`, transition: "transform 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Icon name="phone" size={26} color="#fff" />
        </button>
        <p style={{ fontSize: 12, opacity: 0.4, marginTop: 12 }}>{t.endCall}</p>
      </div>

      <div style={{ position: "absolute", bottom: 20, opacity: 0.25, fontSize: 11 }}>{t.rights}</div>
    </div>
  );
}
