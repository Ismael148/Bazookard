// Jeu d'icones pro (style ligne, type Lucide) - SVG inline, aucun CDN.
import type { CSSProperties } from "react";

const P: Record<string, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  users: "M8 8a3.2 3.2 0 1 0 0-6.4M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9",
  workspace: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  template: "M4 4h16v5H4zM4 12h7v8H4zM13 12h7v8h-7z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z",
  plus: "M12 5v14M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  link: "M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1",
  check: "M5 12l5 5 9-11",
  x: "M6 6l12 12M18 6 6 18",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  chevron: "M6 9l6 6 6-6",
  logout: "M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12M18 9l3 3-3 3",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8",
  tap: "M9 11V6a2 2 0 0 1 4 0v5M13 11V8.5a2 2 0 0 1 4 0V14a6 6 0 0 1-6 6h-1.5a4 4 0 0 1-3.2-1.6L3 14.5s1-1.2 2.3-.6L7 15",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  inbox: "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6L5 5Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chat: "M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z",
  layers: "M12 3l9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18",
  phone: "M7 2.5h10a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1ZM11 18h2",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3M21 14v7M17 21h-3",
  up: "M12 19V5M6 11l6-6 6 6",
  export: "M12 15V3M8 7l4-4 4 4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4",
  pie: "M12 3v9h9a9 9 0 1 1-9-9Z",
  cash: "M2 6h20v12H2zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
};

export default function Icon({
  name, size = 18, style, strokeWidth = 1.8,
}: { name: keyof typeof P | string; size?: number; style?: CSSProperties; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={style} aria-hidden="true">
      <path d={P[name] ?? P.grid} />
    </svg>
  );
}
