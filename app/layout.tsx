import type { Metadata } from "next";
import { DM_Mono, Geist, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["300", "400", "500"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Schematic AI | AI Data Analyst for CSV & Excel",
    template: "%s | Schematic AI",
  },
  description:
    "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
  metadataBase: new URL("https://getschematicai.com"),
  applicationName: "Schematic AI",
  alternates: {
    canonical: "https://getschematicai.com",
  },
  openGraph: {
    title: "Schematic AI",
    description:
      "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
    url: "https://getschematicai.com",
    siteName: "Schematic AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 628,
        alt: "Schematic AI — AI Data Analyst for CSV & Excel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Schematic AI",
    description:
      "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Schematic AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
  url: "https://getschematicai.com",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Analytics is opt-in via env so forks don't report to the author's property.
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html
      lang="en"
      className={`${geist.variable} ${dmMono.variable} ${instrumentSans.variable} ${instrumentSerif.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <Analytics />
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
