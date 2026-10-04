import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/navigation/shell";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./polish.css";
export const metadata: Metadata = {
  title: {
    default: "VitalScan — A moment for your wellness",
    template: "%s · VitalScan",
  },
  description:
    "Contactless wellness insights from your camera. Private, on-device, experimental camera-based pulse estimates.",
  manifest: "/manifest.webmanifest",
  applicationName: "VitalScan",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VitalScan" },
  icons: {
    icon: [
      { url: "/favicon.png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f8f7",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
