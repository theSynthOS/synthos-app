"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between py-4 px-[10%] text-white border-b-2 border-[#043a68] shadow-lg z-50 bg-[#fdffe2]">
      <div className="logo font-bold text-[2rem] text-[#043a68]">SynthOS</div>
      <ConnectButton />
    </header>
  );
}
