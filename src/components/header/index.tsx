"use client";
import React from "react";
import { ConnectButton } from 'thirdweb/react'
import { client, scrollSepolia } from "../../client";


export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between py-4 px-[10%] text-yellow-200 border-b-2 border-yellow-500 shadow-lg z-50 bg-[#09092f]">
      <div className="logo font-bold text-[2rem] text-yellow-500">SynthOS</div>

      <ConnectButton
        client={client}
        accountAbstraction={{
        chain: scrollSepolia,
        sponsorGas: true,
        }}
        />

    </header>
  );
}