"use client";
import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client, scrollSepolia } from "../../client";
import Link from "next/link";
import { generatePayload, isLoggedIn, login, logout } from "../../actions/login";

export default function Header() {
  return (
    <header className="flex items-center justify-between py-4 px-[10%] text-yellow-200 border-b-2 border-yellow-500 shadow-lg z-50 bg-[#09092f]">
      <Link href="/">
        <div className="logo font-bold text-lg lg:text-[2rem] text-yellow-500">
          SynthOS
        </div>
      </Link>

      <ConnectButton
        connectButton={{
          label: "Sign In",
        }}
        connectModal={{
          showThirdwebBranding: false,
          title: "SynthOS - Sign In",
          titleIcon:
            "https://avatars.githubusercontent.com/u/199569871?s=400&u=a078c4fa4af3ed32392e7ba6bbcf36ce8a6b4379&v=4",
          size: "compact",
        }}
        auth={{
          isLoggedIn: async (address) => {
            console.log("checking if logged in!", { address });
            return await isLoggedIn();
          },
          doLogin: async (params) => {
            console.log("logging in!");
            await login(params);
          },
          getLoginPayload: async ({ address }) =>
            generatePayload({ address, chainId: scrollSepolia.id }),
          doLogout: async () => {
            console.log("logging out!");
            await logout();
          },
        }}
        client={client}
        accountAbstraction={{
          chain: scrollSepolia,
          sponsorGas: true,
        }}
        appMetadata={{
          name: "SynthOS",
          description: "Scroll's #1 Verifiable DeFAI Agent Marketplace",
          url: "https://synthos.fun",
          logoUrl: "/logo.png",
        }}
        autoConnect={true}
        chain={scrollSepolia}
      />
    </header>
  );
}
