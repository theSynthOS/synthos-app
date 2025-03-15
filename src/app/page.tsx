"use client";

import { useState, useRef, useEffect } from "react";
import CustomButton from "../components/buttons/mainButton";
import { Gluten } from "next/font/google";
import ChatbotCard from "../components/chatbotCard";
import { fetchAgentLogs } from "../services/aiAgent";
import Modal from "../components/detailModal";
import { LampContainer } from "../components/ui/lamp";
import { motion } from "framer-motion";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// Mock agent data - this would come from your smart contract
const agentData = {
  id: "d7d9277b-850a-44a1-84e1-8506e9488f33",
  name: "Aave",
  description: "A powerful agent for handling token swaps across multiple protocols",
  category: "DeFi",
  creationDate: "2023-12-15",
  walletAddress: "0x1234...5678",
  executionFees: "0.001 ETH",
  avsPlugin: "Uniswap V3",
  totalTxExecuted: "156",
  lastTxHash: "0xabcd...ef12"
};

interface AgentLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"info" | "logs">("info");
  const [showModal, setShowModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showModal) {
      loadAgentLogs();
    }
  }, [showModal]);

  useEffect(() => {
    if (logsEndRef.current && activeTab === "logs") {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [agentLogs, activeTab]);

  const loadAgentLogs = async () => {
    setIsLoadingLogs(true);
    setLogError(null);
    
    try {
      console.log(`Loading logs for agent: ${agentData.id}`);
      const logs = await fetchAgentLogs();
      
      console.log("Logs received:", logs);
      
      if (logs && logs.length > 0) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...logs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAgentLogs(sortedLogs);
      } else {
        setLogError("No logs available for this agent");
      }
    } catch (error) {
      console.error("Error loading agent logs:", error);
      setLogError("Failed to load agent logs");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      case "debug":
        return "text-gray-400";
      default:
        return "text-gray-200";
    }
  };

  return (
    <main
      className={`min-h-screen flex flex-col space-grotesk relative`}
    >
      <motion.div 
        style={{ opacity:1 }} 
        className="absolute inset-0 "
      >
        <BackgroundGradientAnimation containerClassName="absolute inset-0 z-0" />
      </motion.div>
      
      {/* Banner Area */}
      <div className="relative z-10 pt-[76px] md:pt-[86px] flex flex-col items-center justify-center min-h-[40vh] bg-white/5 backdrop-blur-sm  ">
        <div className="w-full text-center">
          <h1 className="text-xl md:text-4xl font-bold mb-2 text-yellow-500 pt-5">Verifiable DeFAI Agent Marketplace on Scroll</h1>
          <p className="text-yellow-200 text-lg md:text-2xl font-medium">Discover, deploy, and manage AI agents</p>
          <div className="flex justify-center items-center gap-8">
            <CustomButton
              onClick={() => setShowComingSoonModal(true)}
              className="mt-4 px-8 py-2"
            >
              Create Agent
            </CustomButton>

            <CustomButton
              onClick={() => window.open("https://www.notion.so/SynthOS-Automate-Your-Gains-19618bd263f08027993cfa6c5618941d", "_blank")}
              className="mt-4 px-8 py-2"
            >
              Documentation
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Feature Agent Area */}
      <div className="relative z-10 px-4 md:px-8 py-6 w-full">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-yellow-400">Featured Agents</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {/* Agent Card */}
          <div 
            className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4 md:p-6 cursor-pointer hover:border-yellow-500 transition-colors"
            onClick={() => setShowModal(true)}
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">{agentData.name}</h2>
            <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{agentData.description}</p>
            
            <div className="mb-3 md:mb-4 text-sm md:text-base">
              <span className="text-gray-400">Execution Fee:</span>
              <span className="ml-2 text-white">{agentData.executionFees}</span>
            </div>
            
            <div className="text-xs md:text-sm text-gray-400 mt-2 md:mt-4">
              Powered by <a href="#" className="text-blue-400 hover:underline">Autonome</a>
            </div>
          </div>
          
          {/* Add Your Agent Card */}
          <div 
            className="bg-white/5 backdrop-blur-sm border border-dashed border-gray-700 rounded-lg p-4 md:p-6 flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => setShowComingSoonModal(true)}
          >
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-400 mb-1 md:mb-2 ">Add your</h2>
              <p className="text-gray-500 text-sm md:text-base">Create a new agent</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal with Agent Details and Chat */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={agentData.name}
        >
          <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Left Panel - Agent Info and Logs */}
            <div className="md:w-1/2 flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-gray-700 mb-4">
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "info" ? "text-yellow-200 border-b-2 border-yellow-200" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setActiveTab("info")}
                >
                  Info
                </button>
                <button 
                  className={`px-4 py-2 font-medium ${activeTab === "logs" ? "text-yellow-200 border-b-2 border-yellow-200" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setActiveTab("logs")}
                >
                  Logs
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "info" ? (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">{agentData.name}</h2>
                    <p className="text-gray-300">{agentData.description}</p>
                    
                    <div className="mt-6 space-y-3">
                      <div>
                        <span className="text-gray-400">Category:</span>
                        <span className="ml-2 text-white">{agentData.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Agent Creation Date:</span>
                        <a href="#" className="ml-2 text-blue-400 hover:underline">{agentData.creationDate}</a>
                      </div>
                      <div>
                        <span className="text-gray-400">Wallet Address:</span>
                        <span className="ml-2 text-white">{agentData.walletAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Execution Fees:</span>
                        <span className="ml-2 text-white">{agentData.executionFees}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">AVS Plugin:</span>
                        <span className="ml-2 text-white">{agentData.avsPlugin}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total tx executed:</span>
                        <span className="ml-2 text-white">{agentData.totalTxExecuted}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Hash of past tx:</span>
                        <a href="#" className="ml-2 text-blue-400 hover:underline">{agentData.lastTxHash}</a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Agent Logs</h3>
                      <button 
                        onClick={loadAgentLogs}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        disabled={isLoadingLogs}
                      >
                        {isLoadingLogs ? "Loading..." : "Refresh"}
                      </button>
                    </div>
                    
                    {isLoadingLogs ? (
                      <div className="text-center py-4">
                        <p className="text-gray-400">Loading logs...</p>
                      </div>
                    ) : logError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400">{logError}</p>
                      </div>
                    ) : agentLogs.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-400">No logs available</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {agentLogs.map((log) => (
                          <div key={log.id} className="bg-[#0f0f3d] p-3 rounded">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{formatTimestamp(log.timestamp)}</span>
                              <span className={getLevelColor(log.level)}>{log.level}</span>
                            </div>
                            <p className="text-white text-sm whitespace-pre-wrap">{log.message}</p>
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chatbot */}
            <div className="md:w-1/2 h-full">
              <ChatbotCard 
                agentId={agentData.id}
                agentName={agentData.name}
                title={`Chat with ${agentData.name}`}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <Modal
          onClose={() => setShowComingSoonModal(false)}
          title="Coming Soon"
        >
          <div className="flex flex-col items-center justify-center h-full py-10">
            <div className="bg-[#1a1a4a] p-8 rounded-lg text-center max-w-md">
              <h2 className="text-2xl font-bold text-yellow-200 mb-4">Upcoming in V2</h2>
              <p className="text-gray-200 mb-6">
                We&apos;re working hard to bring you the ability to create and deploy your own agents.
                This feature will be available in our next major release.
              </p>
              <p className="text-gray-300 mb-8">
                Stay tuned for updates and be the first to know when it launches!
              </p>
              <CustomButton
                onClick={() => setShowComingSoonModal(false)}
                className="px-8 py-2"
              >
                Got it
              </CustomButton>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
