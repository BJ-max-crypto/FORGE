import type { Metadata, Viewport } from "next";
import { ForgeProvider } from "@/components/forge-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE",
  description: "Turn intentions into consistent daily action.",
  applicationName: "FORGE",
  appleWebApp: {
    capable: true,
    title: "FORGE",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ForgeProvider>{children}</ForgeProvider>
      </body>
    </html>
  );
}
