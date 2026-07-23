"use client";
// Couche upload Bazookard — mode DÉMO.
// Aujourd'hui : compression côté client → data URL (localStorage).
// En prod : uploadImage() enverra le fichier compressé vers Supabase Storage
// (URL signée + CDN) et renverra l'URL publique. Même signature.
import { supabaseEnabled, createClient } from "./supabase/client";

export interface UploadOptions {
  maxSize?: number;   // côté le plus long, px
  quality?: number;   // 0..1
}

/** Redimensionne + compresse une image dans le navigateur (WebP, fallback JPEG). */
export function processImage(file: File, opts: UploadOptions = {}): Promise<string> {
  const { maxSize = 1280, quality = 0.82 } = opts;
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) { reject(new Error("Fichier non image")); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas indisponible")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      // WebP si supporté, sinon JPEG
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", quality);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

/** Point d'entrée unique : Supabase Storage si configuré, sinon data URL (démo). */
export async function uploadImage(file: File, opts?: UploadOptions): Promise<string> {
  const dataUrl = await processImage(file, opts);
  if (!supabaseEnabled()) return dataUrl;

  // Supabase Storage : upload du fichier compressé → URL publique CDN
  try {
    const sb = createClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return dataUrl; // pas connecté : repli local
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.includes("webp") ? "webp" : "jpg";
    const path = `${u.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from("karte-images").upload(path, blob, { contentType: blob.type });
    if (error) return dataUrl;
    return sb.storage.from("karte-images").getPublicUrl(path).data.publicUrl;
  } catch {
    return dataUrl;
  }
}

/** Envoie une image déjà recadrée (data URL) : Storage si configuré, sinon telle quelle. */
export async function uploadDataUrl(dataUrl: string): Promise<string> {
  if (!supabaseEnabled()) return dataUrl;
  try {
    const sb = createClient();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return dataUrl;
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.includes("webp") ? "webp" : "jpg";
    const path = `${u.user.id}/${Date.now()}-crop-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from("karte-images").upload(path, blob, { contentType: blob.type });
    if (error) return dataUrl;
    return sb.storage.from("karte-images").getPublicUrl(path).data.publicUrl;
  } catch { return dataUrl; }
}
