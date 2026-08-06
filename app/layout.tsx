import type { Metadata } from "next";
import { DM_Mono, Geist, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Schematic AI",
    template: "%s | Schematic AI",
  },
  description:
    "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
  metadataBase: new URL("https://getschematicai.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Schematic AI",
    description:
      "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
    url: "https://getschematicai.com",
    siteName: "Schematic AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Schematic AI",
    description:
      "Schematic AI is an AI data analyst that lets businesses upload CSV and Excel files, ask questions in plain English, and get trustworthy insights from their data in seconds.",
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
  return (
    <html
      lang="en"
      className={`${geist.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full dark antialiased`}
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
    </html>
  );
}
