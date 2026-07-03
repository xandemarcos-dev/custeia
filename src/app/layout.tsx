import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { SuccessToast } from "@/components/SuccessToast";
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
  metadataBase: new URL("https://batchflow-rho.vercel.app"),
  title: "BatchFlow — custo sob controle",
  description: "Precificação, estoque e margem para confeitaria. Saiba exatamente quanto custa cada produto e venda com a margem certa.",
  openGraph: {
    title: "BatchFlow — custo sob controle",
    description: "Precificação, estoque e margem para confeitaria. Saiba exatamente quanto custa cada produto e venda com a margem certa.",
    url: "https://batchflow-rho.vercel.app",
    siteName: "BatchFlow",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "BatchFlow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BatchFlow — custo sob controle",
    description: "Precificação, estoque e margem para confeitaria.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          localization={{
            signIn: {
              start: {
                title: "Entrar no BatchFlow",
                subtitle: "Bem-vindo de volta! Faça login para continuar.",
              },
            },
            signUp: {
              start: {
                title: "Criar conta no BatchFlow",
                subtitle: "Preencha os dados para começar.",
              },
            },
          }}
        >
          {children}
          <Toaster />
          <Suspense>
            <SuccessToast />
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}
