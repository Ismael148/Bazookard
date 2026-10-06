"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { clientSession, clientLogoutDb } from "@/lib/admin-db";

const SEEN_KEY = "bzk_seen_leads";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState("");
  const [newLeads, setNewLeads] = useState(0);
  const isLogin = pathname === "/client/login";
  const isEditor = pathname.startsWith("/client/editor");

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setCompany(s.client.company);
    setReady(true);
    // Total des messages/contacts reçus (toutes cartes) = notification si nouveaux
    const total = s.workspaces.reduce((a, w) => a + (w.stats?.lead ?? 0), 0);
    let seen = 0;
    try { seen = Number(localStorage.getItem(SEEN_KEY) || "0"); } catch {}
    if (pathname === "/client/leads") {
      // On considère les messages comme lus dès qu'on ouvre la boîte
      try { localStorage.setItem(SEEN_KEY, String(total)); } catch {}
      setNewLeads(0);
    } else {
      setNewLeads(Math.max(0, total - seen));
    }
  }, [pathname, isLogin, router]);

  if (isLogin) return <div className="admin">{children}</div>;
  if (!ready) return <div className="admin" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>Chargement…</div>;
  if (isEditor) return <>{children}</>; // l'éditeur garde son plein écran

  return (
    <div className="admin" style={{ display: "grid", gridTemplateColumns: "248px 1fr" }}>
      <aside style={{ borderRight: "1px solid var(--line)", background: "#fff", padding: "20px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/client" style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 18px", textDecoration: "none", color: "var(--ink)" }}>
          <LogoImg h={64} style={{ margin: "0 auto" }} />
        </Link>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", padding: "8px 8px 6px" }}>Espace client</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Link href="/client" className={`a-nav-item${pathname === "/client" ? " active" : ""}`}><Icon name="card" size={18} /> Mes cartes</Link>
          <Link href="/client/stats" className={`a-nav-item${pathname === "/client/stats" ? " active" : ""}`}><Icon name="pie" size={18} /> Performance</Link>
          <Link href="/client/leads" className={`a-nav-item${pathname === "/client/leads" ? " active" : ""}`}>
            <Icon name="inbox" size={18} /> Contacts &amp; messages
            {newLeads > 0 && <span className="cl-badge">{newLeads > 99 ? "99+" : newLeads}</span>}
          </Link>
          <Link href="/client/loyalty" className={`a-nav-item${pathname === "/client/loyalty" ? " active" : ""}`}><Icon name="gift" size={18} /> Fidélité</Link>
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink2)", padding: "0 8px 10px", fontWeight: 600 }}>{company}</div>
          <button className="a-btn a-btn-sm" style={{ width: "100%", justifyContent: "center" }}
            onClick={() => { clientLogoutDb(); router.replace("/client/login"); }}>
            <Icon name="logout" size={16} /> Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
