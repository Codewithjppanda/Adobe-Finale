import type { Metadata } from "next";
import "@/src/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-ui",
  display: "swap"
});

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Document Intelligence",
  description: "Stylish, fast PDF reader",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://documentcloud.adobe.com/view-sdk/main.js" async />
        <script dangerouslySetInnerHTML={{ __html: "(function(){var s=document.createElement('script'); s.src='/config.js'; document.head.appendChild(s);})();" }} />
      </head>
      <body className={`min-h-dvh antialiased ${inter.variable} ${plusJakarta.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}


