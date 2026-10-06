"use client";
// Connexion / inscription (Supabase Auth). En mode démo, redirige vers le dashboard.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LogoImg } from "@/components/Logo";
import { supabaseEnabled, createClient } from "@/lib/supabase/client";
import { currentUser, signOut } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseEnabled()) { router.replace("/dashboard"); return; }
    void currentUser().then((u) => {
      const em = (u as { email?: string } | null)?.email;
      if (em) setAuthedEmail(em);
    });
  }, [router]);

  async function logout() {
    setBusy(true);
    try { await signOut(); } finally { setBusy(false); setAuthedEmail(null); }
  }

  // Déjà connecté : proposer d'aller au tableau de bord OU de se déconnecter
  if (authedEmail) {
    return (
      <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
        <div className="a-card" style={{ width: "100%", maxWidth: 400, padding: 30, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><LogoImg h={84} /></div>
          <p style={{ fontWeight: 700, fontSize: 16 }}>Vous êtes déjà connecté</p>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "6px 0 20px" }}>{authedEmail}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="a-btn a-btn-primary" style={{ justifyContent: "center" }} onClick={() => router.replace("/dashboard")}>
              Aller à mes cartes <Icon name="arrow" size={16} />
            </button>
            <button className="a-btn" style={{ justifyContent: "center" }} onClick={logout} disabled={busy}>
              {busy ? "…" : "Se déconnecter"}
            </button>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 16 }}>
            <Link href="/" style={{ color: "inherit" }}>← Retour au site</Link>
          </p>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    const sb = createClient();
    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password: pwd });
        if (error) { setErr(error.message); return; }
        setInfo("Compte créé ! Vérifie ta boîte mail si la confirmation est activée, puis connecte-toi.");
        setMode("login");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pwd });
        if (error) { setErr("Email ou mot de passe incorrect."); return; }
        router.replace("/dashboard");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="a-card" style={{ width: "100%", maxWidth: 400, padding: 30 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <LogoImg h={84} />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
          {mode === "login" ? "Connecte-toi pour retrouver tes cartes." : "Crée ton compte — c'est parti."}
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
          {err && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{err}</div>}
          {info && <div style={{ color: "var(--success)", fontSize: 13, fontWeight: 600 }}>{info}</div>}
          <button className="a-btn a-btn-primary" style={{ justifyContent: "center", marginTop: 6 }} type="submit" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"} <Icon name="arrow" size={16} />
          </button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}
          style={{ background: "none", border: "none", color: "var(--accent-deep)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16, width: "100%" }}>
          {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12, textAlign: "center" }}>
          <Link href="/" style={{ color: "inherit" }}>← Retour au site</Link>
        </p>
      </div>
    </div>
  );
}
