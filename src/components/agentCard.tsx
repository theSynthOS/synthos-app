// components/AgentCard.tsx
"use client";
import React from "react";
import CustomButton from "./buttons/mainButton";
import Image from "next/image";

export interface Agent {
  id: string;
  name: string;
  logo: string;
  description?: string;
  buttons: {
    label: string;
    info: string;
    description?: string;
    imageUrl?: string;
  }[];
}

export interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      className="group relative transition-transform duration-300 ease-out transform group-hover:scale-105 group-hover:shadow-xl h-80 overflow-hidden rounded-[20px]"
      onClick={onClick}
    >
      {/* Agent image */}
      <Image
        src={agent.logo}
        alt={agent.name}
        width={500}
        height={500}
        className="w-full h-full object-cover"
      />
      {/* Gradient overlay: transitions to a darker overlay on hover */}
      <div className="absolute inset-0 overlay transition-all duration-500"></div>
      {/* Centered text: appears on hover */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <h3 className="text-yellow-200 text-2xl font-bold mb-4 pt-[30%]">
          {agent.name}
        </h3>
        <CustomButton className="text-[1.5rem] max-w-[200px] p-2 text-yellow-200">
          View Agents
        </CustomButton>
      </div>
      <style jsx>{`
        .overlay {
          background: linear-gradient(to top,#09092f, transparent);
          opacity: 0;
        }
        .group:hover .overlay {
          background: linear-gradient(to top,#09092f, transparent);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}