// app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { mainnet, scrollSepolia } from "wagmi/chains";
import { http } from "viem";
import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode } from "react";

// Define the chains your dApp will support
const chains = [mainnet, scrollSepolia] as const;
console.log("Available Chains in Production:", chains);


// Get the default connectors from RainbowKit (ensure you have a valid project ID)
const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
});

// Create a wagmi configuration
const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [scrollSepolia.id]: http(),
  },
});

// Create a base RainbowKit theme using lightTheme with your custom settings
const baseTheme = lightTheme({
  accentColor: "#eab308", // Button and accent color (yellow-500)
  accentColorForeground: "#f7f8e6", // Foreground (text) color
  fontStack: "custom" as any, // Use custom font defined globally
  overlayBlur: "small",
});

// Extend the base theme by overriding text colors and adding CSS variables
const myRainbowTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    modalText: "#f7f8e6", // Text color inside modals
    connectButtonText: "#f7f8e6", // Text color on the Connect button
    modalBorder: "#eab308", // Border color (yellow-500)
    modalBackground: "#09092f", // Modal background color
    connectButtonBackground: "#09092f", // Connect button background
  },
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={myRainbowTheme}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
