"use client";

import React from "react";
import Chatbot from "./chatbot";

interface ChatbotCardProps {
  agentId?: string;
  agentName?: string;
  title?: string;
  executionFees?: bigint;
  creatorAddress?: string;
  userAddress?: string;
}

export default function ChatbotCard({
  agentId,
  userAddress,
  agentName = "AI Assistant",
  title = "AI is the new UI",
  executionFees = BigInt(0),
  creatorAddress = "0xeb0d8736Cc2c47882f112507cc8A3355d37D2413",
}: ChatbotCardProps) {
  return (
    <div
      className={`w-full h-full rounded-[20px] overflow-hidden bg-[#0d0d35] border border-gray-700 shadow-lg pt-2`}
    >
      <div className="bg-[#1a1a4a] p-3 border-b border-gray-700">
        <h2 className="text-xl font-bold text-yellow-200">{title}</h2>
        <p className="text-sm text-gray-300">Powered by Autonome</p>
      </div>
      <div className="h-[calc(100%-60px)]">
        <Chatbot
          agentId={agentId}
          agentName={agentName}
          executionFees={executionFees}
          creatorAddress={creatorAddress}
        />
        <Chatbot agentId={agentId} agentName={agentName} userAddress={userAddress} />
      </div>
    </div>
  );
}
