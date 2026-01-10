import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduRace - Belajar Sambil Balapan",
  description: "Game edukasi seru yang menggabungkan quiz dengan gameplay balapan. Uji pengetahuanmu sambil menikmati keseruan balapan!",
  keywords: ["edukasi", "game", "quiz", "balapan", "racing", "belajar", "tryout"],
  authors: [{ name: "EduRace Team" }],
  openGraph: {
    title: "EduRace - Belajar Sambil Balapan",
    description: "Game edukasi seru yang menggabungkan quiz dengan gameplay balapan.",
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
