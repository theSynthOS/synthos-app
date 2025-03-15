"use client";

import { useState } from "react";
import CustomButton from "../components/buttons/mainButton";
import AgentCard, { Agent } from "../components/agentCard";
import { Gluten } from "next/font/google";
import Modal from "../components/detailModal";
import ChatbotCard from "../components/chatbotCard";

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
    logo: "/images/swap.png",
    buttons: [
      {
        label: "Aave",
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
    name: "Stake Agent",
    logo: "/images/stake.png",
    buttons: [
      {
        label: "Stake Button 1",
        info: "Stake Button 1: Helps with token conversion.",
        description: "Converts tokens using the best available rate.",
        imageUrl: "/images/swap1.png",
      },
      {
        label: "Stake Button 2",
        info: "Stake Button 2: Offers optimized routing.",
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
  const [showChatbot, setShowChatbot] = useState(false);

  // Function to handle button image click
  const handleButtonImageClick = () => {
    setShowChatbot(true);
  };

  // Function to handle start agent button click
  const handleStartAgent = () => {
    setShowChatbot(true);
    setSelectedButtonData(null);
  };

  return (
    <main
      className={`min-h-screen flex flex-col pt-[76px] md:pt-[50px] ${gluten.className}`}
    >
      <div className="flex flex-row justify-between items-center pt-[7%] pb-[2%] px-[5%]">
        <h2 className="text-[1.5rem] md:text-[2rem] lg:text-[3rem] font-bold">Featured Agent</h2>
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
                setShowChatbot(false); // Reset chatbot visibility
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
          <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Left Section: Vertically Centered Buttons */}
            <div className="flex flex-col gap-6 md:w-1/2">
             
              
              {/* Agent Function Buttons */}
              <div className="bg-[#1a1a4a] p-4 rounded-lg">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-yellow-200 mb-4">Agent Functions</h3>
                <div className="flex flex-col gap-3">
                  {selectedAgent.buttons.map((btn, index) => (
                    <CustomButton
                      key={index}
                      className="text-md md:text-lg lg:text-xl p-1"
                      onClick={() => {
                        setSelectedButtonData(btn);
                        setShowChatbot(false);
                      }}
                    >
                      {btn.label}
                    </CustomButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section: Button Details or Chatbot */}
            <div className="md:w-1/2 h-full">
              {showChatbot ? (
                <ChatbotCard 
                  agentId={selectedAgent.id}
                  agentName={selectedAgent.name}
                  title={`Chat with ${selectedAgent.name}`}
                />
              ) : selectedButtonData ? (
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg h-full">
                  <h3 className="text-xl font-bold mb-2">{selectedButtonData.label}</h3>
                  <p className="text-gray-200 mb-4">{selectedButtonData.info}</p>
                  {selectedButtonData.description && (
                    <p className="text-gray-300 mb-4">{selectedButtonData.description}</p>
                  )}
                  {selectedButtonData.imageUrl && (
                    <div className="relative group">
                      <div className="absolute inset-0 flex items-center justify-start mt-8">
                        <CustomButton
                          className="text-md md:text-lg lg:text-xl px-3"
                          onClick={handleButtonImageClick}
                        >
                          Start Chat
                        </CustomButton> 
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Select a button or use the Start Agent button to interact with this agent</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
