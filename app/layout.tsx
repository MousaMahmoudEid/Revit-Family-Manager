import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ErrorReporter, ReactErrorBoundary } from "@/components/error-reporter";

export const metadata: Metadata = {
  title: "Revit Family Manager",
  description: "Organize and manage your BIM Revit content library",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ReactErrorBoundary>
          {children}
        </ReactErrorBoundary>
        <Toaster />
        <Analytics />
        <ErrorReporter />
      </body>
    </html>
  );
}
