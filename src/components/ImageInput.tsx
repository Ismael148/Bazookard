"use client";
// Champ image de l'éditeur : upload + RECADRAGE intégré (zoom, position, format),
// compression automatique, aperçu, suppression — avec repli "coller une URL".
import { useEffect, useRef, useState } from "react";
import { uploadImage, uploadDataUrl } from "@/lib/upload";

const RATIOS: { key: string; label: string; v: number | null }[] = [
  { key: "libre", label: "Libre", v: null },
  { key: "1:1", label: "Carré", v: 1 },
  { key: "16:9", label: "Paysage", v: 16 / 9 },
  { key: "3:4", label: "Portrait", v: 3 / 4 },
];

export default function ImageInput({ value, onChange, disabled = false, placeholder }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [urlMode, setUrlMode] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null); // image en attente de recadrage

  async function handleFile(file: File | undefined | null) {
    if (!file || disabled) return;
    setErr(""); setBusy(true);
    try {
      const url = await uploadImage(file, { maxSize: 1800, quality: 0.9 });
      setCropSrc(url); // ouvre le recadrage
    } catch {
      setErr("Impossible de lire cette image.");
    } finally { setBusy(false); }
  }

  if (cropSrc) {
    return (
      <CropModal
        src={cropSrc}
        onCancel={() => setCropSrc(null)}
        onDone={async (dataUrl) => {
          setCropSrc(null); setBusy(true);
          try { onChange(await uploadDataUrl(dataUrl)); } finally { setBusy(false); }
        }}
        onSkip={async () => { const v = cropSrc; setCropSrc(null); onChange(v); }}
      />
    );
  }

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: 10, backgroundImage: `url('${value}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid var(--line)", flexShrink: 0 }} />
        {!disabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" className="btn" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => fileRef.current?.click()}>
              {busy ? "…" : "Remplacer"}
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setCropSrc(value)} title="Recadrer">✂️</button>
              <button type="button" className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12, color: "#f87171" }} onClick={() => onChange("")}>
                Retirer
              </button>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  if (urlMode) {
    return (
      <input
        className="in" autoFocus placeholder={placeholder || "https://…"}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange((e.target as HTMLInputElement).value); setUrlMode(false); } }}
        onBlur={(e) => { if (e.target.value) onChange(e.target.value); setUrlMode(false); }}
      />
    );
  }

  return (
    <div>
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        style={{
          border: "1.5px dashed var(--line)", borderRadius: 10, padding: "16px 12px",
          textAlign: "center", cursor: disabled ? "not-allowed" : "pointer",
          color: "var(--muted)", fontSize: 12.5,
        }}
      >
        {busy ? "Traitement…" : <>📷 Cliquez ou glissez une image<br /><span style={{ fontSize: 11, opacity: .8 }}>recadrage + compression inclus</span></>}
      </div>
      {!disabled && (
        <button type="button" onClick={() => setUrlMode(true)}
          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11.5, cursor: "pointer", marginTop: 5, padding: 0, textDecoration: "underline" }}>
          ou coller une URL
        </button>
      )}
      {err && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{err}</div>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

/* ================= Outil de recadrage ================= */
function CropModal({ src, onDone, onCancel, onSkip }: {
  src: string; onDone: (dataUrl: string) => void; onCancel: () => void; onSkip: () => void;
}) {
  const [ratio, setRatio] = useState<number | null>(1);
  const [zoom, setZoom] = useState(1);
  const [px, setPx] = useState(50); // position % horizontale
  const [py, setPy] = useState(50); // position % verticale
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => { imgRef.current = im; setLoaded(true); };
    im.src = src;
  }, [src]);

  function compute() {
    const im = imgRef.current;
    if (!im) return null;
    const srcRatio = im.width / im.height;
    const outRatio = ratio ?? srcRatio;
    // zone source : la plus grande fenêtre au bon ratio, réduite par le zoom
    let cw = im.width, ch = im.height;
    if (srcRatio > outRatio) cw = im.height * outRatio; else ch = im.width / outRatio;
    cw /= zoom; ch /= zoom;
    const cx = (im.width - cw) * (px / 100);
    const cy = (im.height - ch) * (py / 100);
    return { im, cx, cy, cw, ch, outRatio };
  }

  function validate() {
    const c = compute();
    if (!c) return;
    const outW = Math.min(1280, Math.round(c.cw));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = Math.round(outW / c.outRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      ctx.drawImage(c.im, c.cx, c.cy, c.cw, c.ch, 0, 0, canvas.width, canvas.height);
      let out = canvas.toDataURL("image/webp", 0.85);
      if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", 0.85);
      onDone(out);
    } catch {
      // image protégée (CORS) : on garde l'originale plutôt que d'échouer
      onSkip();
    }
  }

  // aperçu live via background-position/size
  const previewRatio = ratio ?? (imgRef.current ? imgRef.current.width / imgRef.current.height : 1);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(10,12,10,.6)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 18 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up"
        style={{ width: "100%", maxWidth: 420, background: "#fff", color: "#17140C", borderRadius: 18, padding: 20, boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)" }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 12 }}>✂️ Recadrer l&apos;image</div>

        {/* Aperçu */}
        <div style={{ width: "100%", aspectRatio: String(previewRatio), maxHeight: 300, borderRadius: 12, border: "1px solid #ECE9E0", overflow: "hidden",
          backgroundImage: `url('${src}')`, backgroundRepeat: "no-repeat",
          backgroundSize: `${zoom * 100}% auto`,
          backgroundPosition: `${px}% ${py}%` }} />

        {/* Format */}
        <div style={{ display: "flex", gap: 6, margin: "12px 0 10px", flexWrap: "wrap" }}>
          {RATIOS.map((r) => (
            <button key={r.key} onClick={() => setRatio(r.v)}
              style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: "1px solid " + ((ratio === r.v) ? "#E8A800" : "#ECE9E0"),
                background: (ratio === r.v) ? "#FFD500" : "#fff", color: "#17140C" }}>
              {r.label}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12, color: "#8A8474", display: "block" }}>Zoom</label>
        <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%", accentColor: "#E8A800" }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#8A8474" }}>Horizontal</label>
            <input type="range" min={0} max={100} value={px} onChange={(e) => setPx(Number(e.target.value))} style={{ width: "100%", accentColor: "#E8A800" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#8A8474" }}>Vertical</label>
            <input type="range" min={0} max={100} value={py} onChange={(e) => setPy(Number(e.target.value))} style={{ width: "100%", accentColor: "#E8A800" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={validate} disabled={!loaded}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#FFD500", color: "#171207", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            ✓ Valider le recadrage
          </button>
          <button onClick={onSkip}
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #ECE9E0", background: "#fff", color: "#17140C", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Sans recadrer
          </button>
          <button onClick={onCancel}
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #ECE9E0", background: "#fff", color: "#8A8474", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
