import localFont from "next/font/local";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const dmSans = localFont({
  src: [
    {
      path: "../../fonts/dm-sans/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

// Secondary/body typeface; --text-family resolves to --font-inter.
const inter = localFont({
  src: [
    { path: "../../fonts/inter/Inter_24pt-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/inter/Inter_24pt-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../fonts/inter/Inter_24pt-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/inter/Inter_24pt-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../../fonts/inter/Inter_24pt-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../fonts/inter/Inter_24pt-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../../fonts/inter/Inter_24pt-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../fonts/inter/Inter_24pt-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "COLABORA",
  description: "COLABORA operational workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
