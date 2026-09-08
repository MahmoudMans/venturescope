import {
  SkipToContent,
} from "@/components/accessibility/skip-to-content";
import type {
  Metadata,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VentureScope",
    template: "%s | VentureScope",
  },

  description:
    "Financial planning and scenario simulation for startups and growing businesses.",

  applicationName: "VentureScope",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background text-foreground antialiased`}
      >
        <SkipToContent />

        <span
          id="main-content"
          tabIndex={-1}
          className="sr-only"
        >
          Main content
        </span>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
