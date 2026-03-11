// © Danial Mohmad — All Rights Reserved
import { COLORS } from "../../constants/colors";

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 13, cursor: "pointer", position: "relative",
        background: value ? COLORS.primary : "#D1CBC7", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}
