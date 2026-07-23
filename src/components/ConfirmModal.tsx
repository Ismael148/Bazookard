"use client";
// Popup de confirmation Bazookard — remplace les confirm() natifs partout.
export default function ConfirmModal({ message, confirmLabel = "Supprimer", onConfirm, onCancel, dark = false }: {
  message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; dark?: boolean;
}) {
  const surface = dark ? "#0e2a20" : "#ffffff";
  const ink = dark ? "#eafaf3" : "#17140C";
  const soft = dark ? "#8fb3a5" : "#5C574A";
  const line = dark ? "#1c3a30" : "#ECE9E0";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,12,10,.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up"
        style={{ width: "100%", maxWidth: 380, background: surface, color: ink, border: `1px solid ${line}`, borderRadius: 18, padding: 24, boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)", textAlign: "center" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#FDEEEE", color: "#D64545", display: "grid", placeItems: "center", fontSize: 20, margin: "0 auto 12px" }}>!</div>
        <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{message}</p>
        <p style={{ fontSize: 12.5, color: soft, marginTop: 6 }}>Cette action est définitive.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${line}`, background: "transparent", color: ink, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "none", background: "#D64545", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
