"use client";
import Icon from "./Icon";

export default function AdminHeader({
  title, subtitle, children,
}: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 11, color: "var(--muted)", display: "flex" }}><Icon name="search" size={16} /></span>
          <input className="a-input" placeholder="Rechercher…" style={{ paddingLeft: 34, width: 210, height: 40 }} />
        </div>
        <button className="a-btn" style={{ padding: 10, position: "relative" }} aria-label="Notifications">
          <Icon name="bell" size={18} />
          <span style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-deep)", border: "2px solid #fff" }} />
        </button>
        {children}
      </div>
    </div>
  );
}
