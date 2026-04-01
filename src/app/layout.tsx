import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Mi Informe",
  description: "Registro de actividad y progreso de servicio del campo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mi Informe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-surface text-on-surface`}>
        {children}
      </body>
    </html>
  );
}
