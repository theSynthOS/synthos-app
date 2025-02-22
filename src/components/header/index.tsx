"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 flex flex-row justify-between p-4 bg-gray-900 text-white">
      <div className="logo font-bold">SynthOS</div>
      <ConnectButton />
    </header>
  );
}
