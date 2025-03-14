// app/layout.tsx
import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import "../styles/globals.css";
import Header from "../components/header";
import { Gluten, Titillium_Web } from "next/font/google";

const gluten = Gluten({
  subsets: ["latin"],
  variable: "--font-gluten", // Optional: create a CSS variable for advanced use
  weight: ["400", "700"], // Define the weights you need
});

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  variable: "--font-titillium",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Synth OS",
  description: "A decentralized operating system for the future",
  icons: {
    icon: "/logo.jpeg",
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
        className={`${gluten.className}`}
        style={{ backgroundColor: "#09092f", minWidth: "100vw" }}
      >
        <ThirdwebProvider>
          <Header />
          <div className="w-full h-full px-[5%] text-yellow-500">
            {children}
          </div>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
