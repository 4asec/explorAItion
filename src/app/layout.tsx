import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-editorial",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Angkasa — Platform Peluang & Roadmap AI Pelajar",
  description:
    "Platform kecerdasan peluang generasi emas: Lomba terkurasi, beasiswa kredibel, dan roadmap persiapan terstruktur berbasis AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#004aad] text-white selection:bg-amber-400/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
