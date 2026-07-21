import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/components/ui/clerk-appearance";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hub Atlas",
  description: "Hub interno da Atlas: CRM, agendamentos e documentos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          {/*
            Aplica tema e estado do menu antes da primeira pintura, pra não
            piscar o tema errado. Precisa ser inline (qualquer script assíncrono
            já chegaria tarde) e via next/script — um <script> cru dentro do
            componente dispara aviso do React 19 e não roda em render no cliente.
          */}
          <Script id="ui-preferences" strategy="beforeInteractive">
            {`(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-theme",t);if(localStorage.getItem("sidebar")==="collapsed"){d.setAttribute("data-sidebar","collapsed")}}catch(e){d.setAttribute("data-theme","dark")}})()`}
          </Script>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
