import type { Metadata } from "next";
import { Space_Grotesk, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import LoadingScreen from "@/components/LoadingScreen";

// Deliberate pairing: Space Grotesk (display) + Sora (body) + JetBrains Mono
// (telemetry). Coolvetica (loaded via @font-face) is reserved for the hero.
const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MetalDetect — live heavy-metal water monitoring",
  description:
    "Distributed electrochemical heavy-metal water monitoring with a 3D live dashboard and ML source attribution.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${space.variable} ${sora.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LoadingScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
