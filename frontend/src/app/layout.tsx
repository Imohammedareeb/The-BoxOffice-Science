import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

// FIX-NAME-02: Correct project name in all metadata
export const metadata: Metadata = {
  title: "BOX OFFICE SCIENCE. | AI Film Investment Intelligence",
  description:
    "AI-powered film investment platform — predict box office revenue, calculate real ROI, and discover high-performing movie concepts.",
  keywords: ["box office", "film investment", "ROI calculator", "movie prediction", "studio analytics"],
  openGraph: {
    title: "BOX OFFICE SCIENCE.",
    description: "Where Silver Age energy meets cutting-edge financial intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AuthProvider>
          <ThemeProvider>
            <AppLayout>{children}</AppLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
