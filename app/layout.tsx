import {
  SkipToContent,
} from "@/components/accessibility/skip-to-content";
import type {
  Metadata,
  Viewport,
} from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import { OfflineNotice } from "@/components/app/offline-notice";
import { NumberPasteFix } from "@/components/forms/number-paste-fix";
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

export const viewport: Viewport = {
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#fafafc",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#14151f",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-svh bg-background text-foreground antialiased"
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

          <OfflineNotice />

          <NumberPasteFix />
        </ThemeProvider>
      </body>
    </html>
  );
}
