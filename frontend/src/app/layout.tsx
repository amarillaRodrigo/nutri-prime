import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prime State | AI Nutrition",
  description: "High performance nutrition tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prime State"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${geistSans.variable} antialiased bg-deep-black text-white`}>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,209,178,0.05)_0%,transparent_50%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
