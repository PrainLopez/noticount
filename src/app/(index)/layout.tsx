"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/src/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { env } from "@/src/env";

import AuthCheck from "../_components/auth-check";
import Navbar from "../_components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Noticount | Multi currency account taker</title>
        <meta name="description" content="Multi currency account taker" />
        <meta name="author" content="Prainy" />
        {env.NEXT_PUBLIC_ENV_TYPE === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <QueryClientProvider client={queryClient}>
          <AuthCheck>
            <div className="flex flex-col items-center justify-start w-full min-h-screen font-medium">
              <main className="flex flex-col content-center items-start justify-start w-full max-w-3xl p-4 gap-4">
                <Toaster />
                <Navbar />
                {children}
              </main>
            </div>
          </AuthCheck>
        </QueryClientProvider>
      </body>
    </html>
  );
}
