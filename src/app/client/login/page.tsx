"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { clientLoginDb } from "@/lib/admin-db";

export default function ClientLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = await clientLoginDb(email, pwd);
    if (!c) { setErr("Email ou mot de passe incorrect."); return; }
    router.replace("/client");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="a-card" style={{ width: "100%", maxWidth: 400, padding: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <LogoImg h={84} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Espace client</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>Connectez-vous avec les identifiants fournis par Adamkom by JJP.</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="a-label">Email</label>
            <input className="a-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="a-label">Mot de passe</label>
            <input className="a-input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{err}</div>}
          <button className="a-btn a-btn-primary" style={{ justifyContent: "center", marginTop: 6 }} type="submit">
            Se connecter <Icon name="arrow" size={16} />
          </button>
        </form>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Identifiants perdus ? Contactez Adamkom by JJP.
        </p>
      </div>
    </div>
  );
}
