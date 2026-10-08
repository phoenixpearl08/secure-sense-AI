import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'RealityVault AI + DocSenseAI | Secure Communication & Document Intelligence',
  description: 'AI-powered adaptive security policies, authenticated AES-256-GCM encryption, and source-grounded document intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#080d1a] text-slate-100 cyber-grid antialiased">
        <Suspense fallback={<div className="h-16 border-b border-slate-800 bg-slate-950" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <span className="font-semibold text-slate-300">REALITYVAULT AI</span> &bull; Core Principle:
              <span className="text-cyan-400 ml-1">AI Recommends. Backend Decides. Cryptography Enforces.</span>
            </div>
            <div className="font-mono text-slate-400">
              AES-256-GCM &bull; Atomic Access &bull; Grounded Q&A
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
