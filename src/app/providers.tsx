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
  accentColor: "#043a68", // Button and accent color
  accentColorForeground: "#f7f8e6", // Foreground (text) color on accent
  borderRadius: "none", // No border rounding ("0px" instead of "none")
  fontStack: "custom" as any, // Use custom font defined globally
  overlayBlur: "small",
});

// Extend the base theme by overriding text colors and adding CSS variables
// for a 1px solid border, a blue overlay, and a small modal container.
const myRainbowTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    modalText: "#043a68", // Text color inside modals
    connectButtonText: "#043a68", // Text color on the Connect button
    modalBorder: "#043a68",
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
