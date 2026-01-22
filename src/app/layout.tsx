import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-orbitron',
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  display: "swap",
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  title: "NitroQuiz - Balap Cerdas Adrenalin Tinggi",
  description: "Game kuis seru berkecepatan tinggi! Jawab pertanyaan, nyalakan nitro, dan jadilah juara di NitroQuiz.",
  keywords: ["edukasi", "game", "quiz", "balapan", "racing", "belajar", "nitro", "turbo"],
  authors: [{ name: "NitroQuiz Team" }],
  openGraph: {
    title: "NitroQuiz - Balap Cerdas Adrenalin Tinggi",
    description: "Game kuis seru berkecepatan tinggi! Jawab pertanyaan, nyalakan nitro, dan jadilah juara.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
