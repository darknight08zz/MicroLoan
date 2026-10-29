import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MicroLoan DApp | Decentralized Micro-Lending",
  description: "Peer-to-peer micro-lending and borrowing platform powered by smart contracts",
  icons: {
    icon: "/logo.png",
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-FOUC script: Immediately apply stored theme preference before render */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("microloan_theme");var d=t==="dark"?"dark":"light";if(d==="dark"){document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark");}else{document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light");}}catch(e){document.documentElement.classList.remove("dark");document.documentElement.setAttribute("data-theme","light");}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--theme-page-bg)] text-[var(--theme-text-secondary)] antialiased font-sans transition-colors duration-200">
        <ThemeProvider>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

