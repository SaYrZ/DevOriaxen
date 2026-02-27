import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DevOriaxen | Digital Solutions Studio",
  description:
    "We craft powerful Discord bots, web applications, and digital tools designed for performance and reliability.",
  openGraph: {
    title: "DevOriaxen | Digital Solutions Studio",
    description:
      "We craft powerful Discord bots, web applications, and digital tools designed for performance and reliability.",
    type: "website",
    url: "https://devoriaxen.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevOriaxen",
    description: "Premium Discord bots and digital solutions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
