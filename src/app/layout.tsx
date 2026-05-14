import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "gaushala.network — The Cow Knowledge Commons",
    template: "%s | gaushala.network",
  },
  description: "The world's knowledge about the cow, in one place. Directory of every gaushala in India. Veterinary knowledge. Vedic scriptures. Jyotish wisdom. Cultural traditions. Built by the community.",
  keywords: ["gaushala", "Indian cows", "gau seva", "cow breeds", "Gir cow", "Sahiwal", "A2 milk", "Panchagavya", "Go-daan", "Vedic", "Ayurveda"],
  authors: [{ name: "gaushala.network community" }],
  creator: "Sandhi AI",
  publisher: "gaushala.network",
  metadataBase: new URL("https://gaushala.network"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gaushala.network",
    siteName: "gaushala.network",
    title: "gaushala.network — The Cow Knowledge Commons",
    description: "The world's knowledge about the cow, in one place. Directory, Wiki, Scriptures, Jyotish, Culture — built by the community.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "gaushala.network — The Cow Knowledge Commons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "gaushala.network — The Cow Knowledge Commons",
    description: "The world's knowledge about the cow, in one place.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
