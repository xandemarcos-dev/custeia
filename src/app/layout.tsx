import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show } from "@clerk/nextjs";
import { CalculatorFab } from "@/components/CalculatorFab";
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
  },
  twitter: {
    card: "summary_large_image",
    title: "BatchFlow — custo sob controle",
    description: "Precificação, estoque e margem para confeitaria.",
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
          <Show when="signed-in">
            <CalculatorFab />
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}
