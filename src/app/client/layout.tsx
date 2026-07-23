"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { clientSession, clientLogoutDb } from "@/lib/admin-db";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState("");
  const isLogin = pathname === "/client/login";
  const isEditor = pathname.startsWith("/client/editor");

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    const s = clientSession();
    if (!s) router.replace("/client/login");
    else { setCompany(s.client.company); setReady(true); }
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
          <Link href="/client/leads" className={`a-nav-item${pathname === "/client/leads" ? " active" : ""}`}><Icon name="inbox" size={18} /> Contacts &amp; messages</Link>
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
