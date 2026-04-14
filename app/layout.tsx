import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PostHogProvider from "./posthog-provider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://templates.3vo.ai"),
  title: "Notion Template OS — Your freelance business, finally organized",
  description:
    "The all-in-one Notion workspace for freelancers and solopreneurs. Manage clients, projects, invoices, and goals — all in one place. Join the waitlist.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Notion Template OS — Your freelance business, finally organized",
    description:
      "The all-in-one Notion workspace for freelancers and solopreneurs. Manage clients, projects, invoices, and goals — all in one place.",
    url: "https://templates.3vo.ai",
    siteName: "Notion Template OS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Notion Template OS — Your freelance business, finally organized",
      },
    ],
    type: "website",
  },
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Notion Template OS",
  description:
    "The all-in-one Notion workspace for freelancers and solopreneurs. Manage clients, projects, invoices, and goals — all in one place.",
  url: "https://templates.3vo.ai",
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-white text-gray-900">
        <PostHogProvider>{children}</PostHogProvider>

        {/* Google Analytics 4 */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}');
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
