import { Playfair_Display, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "TerraSafe // Off-Grid Navigation Engine",
  description: "Tactical, infrastructure-less navigation ecosystem for extreme, off-grid environments.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${monoFont.variable} ${sansFont.variable} antialiased dark`}
    >
      <body className="bg-[#050505] text-[#ededed] selection:bg-[#34d399]/30 selection:text-[#34d399]">
        {children}
      </body>
    </html>
  );
}
