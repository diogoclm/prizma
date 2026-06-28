import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Prizma — Análise de TIR",
  description: "Dashboard de análise de retorno dos projetos Prizma Investimentos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={rubik.variable}>
      <body className="font-sans bg-prizma-50 text-prizma-700">{children}</body>
    </html>
  );
}
