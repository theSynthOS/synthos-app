"use client";

import { useState } from "react";
import CustomButton from "../components/buttons/mainButton";
import AgentCard, { Agent } from "../components/agentCard";
import { Gluten } from "next/font/google";
import Modal from "../components/detailModal";

const gluten = Gluten({
  subsets: ["latin"],
  variable: "--font-gluten",
  weight: ["400", "700"],
});

// Sample dynamic data for agents
const agents: Agent[] = [
  {
    id: "1",
    name: "Dex Agent",
    logo: "/images/defi.png",
    buttons: [
      {
        label: "Dex Button 1",
        info: "Dex Button 1: Provides fast swaps.",
        description: "This button triggers a fast swap execution.",
        imageUrl: "/images/dex1.png",
      },
      {
        label: "Dex Button 2",
        info: "Dex Button 2: Offers deep liquidity.",
        description: "This button shows liquidity pool information.",
        imageUrl: "/images/dex2.png",
      },
    ],
  },
  {
    id: "3",
    name: "Swap Agent",
    logo: "/images/defi.png",
    buttons: [
      {
        label: "Swap Button 1",
        info: "Swap Button 1: Helps with token conversion.",
        description: "Converts tokens using the best available rate.",
        imageUrl: "/images/swap1.png",
      },
      {
        label: "Swap Button 2",
        info: "Swap Button 2: Offers optimized routing.",
        description: "Provides routing optimization for swaps.",
        imageUrl: "/images/swap2.png",
      },
    ],
  },
  {
    id: "2",
    name: "Swap Agent",
    logo: "/images/defi.png",
    buttons: [
      {
        label: "Swap Button 1",
        info: "Swap Button 1: Helps with token conversion.",
        description: "Converts tokens using the best available rate.",
        imageUrl: "/images/swap1.png",
      },
      {
        label: "Swap Button 2",
        info: "Swap Button 2: Offers optimized routing.",
        description: "Provides routing optimization for swaps.",
        imageUrl: "/images/swap2.png",
      },
    ],
  },
  {
    id: "4",
    name: "Swap Agent",
    logo: "/images/defi.png",
    buttons: [
      {
        label: "Swap Button 1",
        info: "Swap Button 1: Helps with token conversion.",
        description: "Converts tokens using the best available rate.",
        imageUrl: "/images/swap1.png",
      },
      {
        label: "Swap Button 2",
        info: "Swap Button 2: Offers optimized routing.",
        description: "Provides routing optimization for swaps.",
        imageUrl: "/images/swap2.png",
      },
    ],
  },
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedButtonData, setSelectedButtonData] = useState<
    Agent["buttons"][0] | null
  >(null);

  return (
    <main
      className={`min-h-screen flex flex-col pt-[74px] ${gluten.className}`}
    >
      <div className="flex flex-row justify-between items-center pt-[7%] pb-[5%] px-[5%]">
        <h2 className="text-[3rem] font-bold">Featured Agent</h2>
        {/* <CustomButton className="text-[1.5rem] w-[200px]">
          Create Agent
        </CustomButton> */}
      </div>

      {/* Main Layout: Grid of Agent Cards & a Sidebar Info Panel */}
      <div className="flex flex-row gap-8 px-[5%]">
        {/* Left: Agent Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => {
                setSelectedAgent(agent);
                setSelectedButtonData(null); // Reset when switching agents
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal: When an Agent is Selected */}
      {selectedAgent && (
        <Modal
          onClose={() => setSelectedAgent(null)}
          title={selectedAgent.name}
        >
          <div className="flex flex-row gap-4">
            {/* Left Section: Vertically Centered Buttons */}
            <div className="flex flex-col gap-6 w-1/2">
              {selectedAgent.buttons.map((btn, index) => (
                <CustomButton
                  key={index}
                  className="text-lg"
                  onClick={() => setSelectedButtonData(btn)}
                >
                  {btn.label}
                </CustomButton>
              ))}
            </div>

            {/* Right Section: Full Height Info Panel */}
            <div className="w-1/2 bg-gray-100 p-6 rounded-lg h-[35vh] flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Info Panel</h3>
              {selectedButtonData ? (
                <div className="flex-1 flex flex-col">
                  <p className="text-lg">{selectedButtonData.info}</p>
                  {selectedButtonData.description && (
                    <p className="mt-2 text-sm">{selectedButtonData.description}</p>
                  )}
                  {selectedButtonData.imageUrl && (
                    <img
                      src={selectedButtonData.imageUrl}
                      alt={selectedButtonData.label}
                      className="mt-2 max-h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <p className="text-lg text-gray-500">Click a button to see details.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
