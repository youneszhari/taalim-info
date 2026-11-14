import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Taalim — Quiz & Simulation CRMEF Informatique",
    template: "%s · Taalim",
  },
  description:
    "Simulation d'examens et quiz QCM pour le concours CRMEF Spécialité Informatique. 6 examens, 480 questions corrigées, historique et progression 100 % locaux.",
  applicationName: "Taalim",
  keywords: [
    "CRMEF",
    "Informatique",
    "QCM",
    "concours",
    "simulation",
    "examen",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const themeScript = `
(function () {
  try {
    var raw = localStorage.getItem("taalim.v1.preferences");
    var prefs = raw ? JSON.parse(raw) : {};
    var theme = prefs.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var accent = prefs.accent || "#2563EB";
    var root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    root.style.setProperty("--accent-color", accent);
    function luminance(hex) {
      var h = String(hex || "").replace("#", "");
      if (h.length !== 6) return 0;
      var r = parseInt(h.slice(0, 2), 16) / 255;
      var g = parseInt(h.slice(2, 4), 16) / 255;
      var b = parseInt(h.slice(4, 6), 16) / 255;
      function channel(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    }
    root.style.setProperty("--accent-contrast", luminance(accent) > 0.42 ? "#09090B" : "#FFFFFF");
  } catch (error) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <Suspense
            fallback={
              <div
                className="h-16 border-b border-border bg-background"
                aria-hidden="true"
              />
            }
          >
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
