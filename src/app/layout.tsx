// app/layout.tsx
import type { Metadata } from "next";
import { ConnectButton, ThirdwebProvider } from "thirdweb/react";
import "../styles/globals.css";
import Header from "../components/header";
import {
  Gluten,
  Titillium_Web,
  Roboto_Mono,
  Space_Grotesk,
} from "next/font/google";

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "700"],
});

const space_grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SynthOS - Scroll's #1 Verifiable DeFAI Agent Marketplace",
  description: "Scroll's #1 Verifiable DeFAI Agent Marketplace",
  icons: {
    icon: "https://avatars.githubusercontent.com/u/199569871?s=400&u=a078c4fa4af3ed32392e7ba6bbcf36ce8a6b4379&v=4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${space_grotesk.className}`} // Use gluten font for the body
        style={{ backgroundColor: "#09092f", minWidth: "100vw" }}
      >
        <ThirdwebProvider>
          <Header />
          <div className="w-full h-full mx-2 overflow-y-hidden">{children}</div>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
