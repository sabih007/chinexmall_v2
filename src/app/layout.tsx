import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

/* The reference uses a rounded geometric sans; Poppins is the closest match
   available through next/font. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "home décor",
    "kitchen accessories",
    "home organization",
    "lifestyle products",
    "gadgets",
    "gifts",
    "direct import",
    "brand new products",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#5b45a3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organisationLd = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: site.legalName,
    url: site.url,
    description: site.description,
    email: site.email,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressCountry: "PK",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          // Static, developer-authored structured data.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationLd) }}
        />

        {children}
      </body>
    </html>
  );
}
