// © Danial Mohmad — All Rights Reserved
import type { User } from "../../types";
import { COLORS } from "../../constants/colors";

const AVATAR_COLORS = ["#E8A598","#7EC8C8","#B5C8E8","#C8B5E8","#E8C8B5","#C8E8B5"];
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface AvatarProps {
  user?: User | null;
  size?: number;
  showOnline?: boolean;
}

export default function Avatar({ user, size = 40, showOnline = false }: AvatarProps) {
  const colorIdx = user ? user.displayName.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const initials = user
    ? user.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatarSrc = user?.avatar
    ? user.avatar.startsWith("http") ? user.avatar : `${BASE_URL}${user.avatar}`
    : null;

  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: avatarSrc ? `url(${avatarSrc}) center/cover` : AVATAR_COLORS[colorIdx],
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: size * 0.36,
        letterSpacing: "-0.02em", userSelect: "none", flexShrink: 0,
      }}>
        {!avatarSrc && initials}
      </div>
      {showOnline && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: user?.online ? COLORS.online : COLORS.textLight,
          border: "2px solid #fff",
        }} />
      )}
    </div>
  );
}
