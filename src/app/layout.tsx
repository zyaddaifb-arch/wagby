import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { WebMCPRegistrar } from "@/components/WebMCPRegistrar";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Zakerly | ذاكرلي",
  description: "أنشئ واجبات لطلابك أونلاين في ثواني",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}>
        <WebMCPRegistrar />
        {children}
      </body>
    </html>
  );
}
