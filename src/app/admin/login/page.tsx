"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { adminAccount, adminLogin, adminRegister } from "@/lib/admin-store";
import { supabaseEnabled, createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { setHasAccount(supabaseEnabled() ? true : Boolean(adminAccount())); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (supabaseEnabled()) {
      const { error } = await createClient().auth.signInWithPassword({ email, password: pwd });
      if (error) { setErr("Email ou mot de passe incorrect. (Créez d'abord votre compte sur /login)"); return; }
      router.replace("/admin");
      return;
    }
    if (!hasAccount) {
      if (pwd.length < 6) { setErr("Mot de passe : 6 caractères minimum."); return; }
      if (pwd !== pwd2) { setErr("Les mots de passe ne correspondent pas."); return; }
      adminRegister(email, pwd);
      router.replace("/admin");
      return;
    }
    if (!adminLogin(email, pwd)) { setErr("Email ou mot de passe incorrect."); return; }
    router.replace("/admin");
  }

  if (hasAccount === null) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Chargement…</div>;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="a-card" style={{ width: "100%", maxWidth: 400, padding: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <LogoImg h={84} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Espace Admin</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
          {hasAccount ? "Connectez-vous à votre espace d'administration." : "Bienvenue ! Créez votre compte administrateur pour commencer."}
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="a-label">Email</label>
            <input className="a-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="a-label">Mot de passe</label>
            <input className="a-input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6} />
          </div>
          {!hasAccount && (
            <div>
              <label className="a-label">Confirmer le mot de passe</label>
              <input className="a-input" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required minLength={6} />
            </div>
          )}
          {err && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{err}</div>}
          <button className="a-btn a-btn-primary" style={{ justifyContent: "center", marginTop: 6 }} type="submit">
            {hasAccount ? "Se connecter" : "Créer mon compte admin"} <Icon name="arrow" size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
