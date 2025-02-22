// app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "../styles/globals.css";
import Header from "../components/header";

export const metadata: Metadata = {
  title: "My DApp",
  description: "A RainbowKit Example with Next.js App Router",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
