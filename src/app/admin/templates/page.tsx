"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import { listTemplates, createWorkspace, type Template } from "@/lib/admin-store";

// Couverture photo + avatar par métier (présentation visuelle des templates)
const NICHE_ART: Record<string, { img: string; emoji: string }> = {
  "Restauration": { img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=640&q=60&auto=format", emoji: "🍽️" },
  "Immobilier":   { img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=640&q=60&auto=format", emoji: "🏠" },
  "Coaching":     { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=60&auto=format", emoji: "💪" },
  "Beauté":       { img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&q=60&auto=format", emoji: "💇‍♀️" },
  "Commerce":     { img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&q=60&auto=format", emoji: "🛍️" },
  "Services":     { img: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=640&q=60&auto=format", emoji: "💼" },
  "Événementiel": { img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=640&q=60&auto=format", emoji: "🎉" },
  "Santé":        { img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=640&q=60&auto=format", emoji: "🩺" },
  "Personnalisé": { img: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=640&q=60&auto=format", emoji: "✨" },
};

export default function TemplatesPage() {
  const [tpls, setTpls] = useState<Template[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => { setTpls(listTemplates()); }, []);
  function use(t: Template) {
    createWorkspace(`${t.name} — nouveau`, t.name.toLowerCase().replace(/\s+/g, "-"));
    setToast(`Workspace créé depuis « ${t.name} »`);
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <div>
      <AdminHeader title="Templates" subtitle="Démarre une carte en un clic, par niche" />
      <div style={{ padding: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18 }}>
          {tpls.map((t) => (
            <div key={t.id} className="a-card a-card-hover fade-up" style={{ overflow: "hidden" }}>
              <div style={{ height: 118, position: "relative",
                background: `linear-gradient(180deg, rgba(23,20,12,.05), rgba(23,20,12,.42)), url('${(NICHE_ART[t.niche] ?? NICHE_ART["Personnalisé"]).img}') center/cover, linear-gradient(135deg,${t.accent[0]},${t.accent[1]})` }}>
                {t.builtin && <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.9)", color: "#17140C", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>Inclus</span>}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #fff", marginTop: -38, display: "grid", placeItems: "center", fontSize: 21,
                  background: `linear-gradient(135deg,${t.accent[0]},${t.accent[1]})`, boxShadow: "0 8px 20px -8px rgba(23,20,12,.4)", position: "relative" }}>
                  {(NICHE_ART[t.niche] ?? NICHE_ART["Personnalisé"]).emoji}
                </div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>{t.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{t.niche}</div>
                <button className="a-btn a-btn-primary a-btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => use(t)}>
                  <Icon name="plus" size={15} /> Utiliser
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}
