"use client";

import React from "react";
import Chatbot from "./chatbot";
import { Gluten } from "next/font/google";

const gluten = Gluten({
  subsets: ["latin"],
  variable: "--font-gluten",
  weight: ["400", "700"],
});

interface ChatbotCardProps {
  agentId?: string;
  agentName?: string;
  title?: string;
}

export default function ChatbotCard({
  agentId,
  agentName = "AI Assistant",
  title = "AI Chatbot",
}: ChatbotCardProps) {
  return (
    <div className={`w-full h-full rounded-[20px] overflow-hidden bg-[#0d0d35] border border-gray-700 shadow-lg ${gluten.className}`}>
      <div className="bg-[#1a1a4a] p-3 border-b border-gray-700">
        <h2 className="text-xl font-bold text-yellow-200">{title}</h2>
        <p className="text-sm text-gray-300">Powered by {agentName}</p>
      </div>
      <div className="h-[calc(100%-60px)]">
        <Chatbot agentId={agentId} agentName={agentName} />
      </div>
    </div>
  );
} 