import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import PostHogProvider from "./posthog-provider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notion Template OS — Your freelance business, finally organized",
  description:
    "The all-in-one Notion workspace for freelancers and solopreneurs. Manage clients, projects, invoices, and goals — all in one place. Join the waitlist.",
  openGraph: {
    title: "Notion Template OS — Your freelance business, finally organized",
    description:
      "The all-in-one Notion workspace for freelancers and solopreneurs. Manage clients, projects, invoices, and goals — all in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="min-h-full bg-white text-gray-900">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
