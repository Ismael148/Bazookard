"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { isAdmin, adminLogout } from "@/lib/admin-store";
import { supabaseEnabled, currentUser, signOut } from "@/lib/db";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: "grid" },
  { href: "/admin/stats", label: "Statistiques", icon: "pie" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
  { href: "/admin/workspaces", label: "Workspaces", icon: "workspace" },
  { href: "/admin/templates", label: "Templates", icon: "template" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    (async () => {
      const ok = supabaseEnabled() ? Boolean(await currentUser()) : isAdmin();
      if (!ok) router.replace("/admin/login");
      else setReady(true);
    })();
  }, [pathname, isLogin, router]);

  if (isLogin) return <div className="admin">{children}</div>;
  if (!ready) return <div className="admin" style={{ display: "grid", placeItems: "center" }}>Chargement…</div>;

  return (
    <div className="admin" style={{ display: "grid", gridTemplateColumns: "248px 1fr" }}>
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid var(--line)", background: "#fff", padding: "20px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 18px", textDecoration: "none", color: "var(--ink)" }}>
          <LogoImg h={64} style={{ margin: "0 auto" }} />
        </Link>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", padding: "8px 8px 6px" }}>Admin</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={`a-nav-item${active ? " active" : ""}`}>
                <Icon name={n.icon} size={18} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <button className="a-btn a-btn-sm" style={{ width: "100%", justifyContent: "center" }}
            onClick={async () => { if (supabaseEnabled()) await signOut(); adminLogout(); router.replace("/admin/login"); }}>
            <Icon name="logout" size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
