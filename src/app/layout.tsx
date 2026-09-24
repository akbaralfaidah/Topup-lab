import type { Metadata } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const jakarta = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-jakarta",
  display: "optional",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: { default: "TOPUPLAB", template: "%s | TOPUPLAB" },
  description:
    "Jelajahi katalog demo TOPUPLAB untuk game dan kebutuhan digital. Transaksi belum tersedia.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
