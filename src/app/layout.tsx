import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bazookard.adamkom.com"),
  title: "Bazookard — Mini-apps NFC intelligentes",
  description:
    "Bazookard, by Adamkom & JJP : la mini-app NFC de ton commerce, propulsée par l'IA. Tap. Connect. Grow.",
  icons: { icon: "/logo-bazookard.png", apple: "/logo-bazookard.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
