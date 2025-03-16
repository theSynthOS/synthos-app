"use client";
import { useState, useRef, useEffect } from "react";
import CustomButton from "../components/buttons/mainButton";
import ChatbotCard from "../components/chatbotCard";
import { fetchAgentLogs } from "../services/aiAgent";
import Modal from "../components/detailModal";
import { motion } from "framer-motion";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { getContract } from "thirdweb";
import { scrollSepoliaTestnet } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";
import { scrollSepolia } from "@/client";
import { client } from "@/client";
 

interface AgentLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

interface AgentData {
  id: string;
  name: string;
  description: string;
  category: string;
  creationDate: string;
  walletAddress: string;
  executionFees: string;
  avsPlugin: string;
  totalTxExecuted: string;
  lastTxHash: string;
  dockerfileHash?: string;
  agentLocation?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"info" | "logs">("info");
  const [showModal, setShowModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showModal) {
      loadAgentLogs();
    
    }
  }, [showModal, activeTab]);

  const loadAgentLogs = async (scrollToBottom = false) => {
    setIsLoadingLogs(true);
    setLogError(null);
    
    try {
      const logs = await fetchAgentLogs();
      
      console.log("Logs received:", logs);
      
      if (logs && logs.length > 0) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...logs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAgentLogs(sortedLogs);
        setLogError(null);
        
        // Only scroll to bottom if explicitly requested
        if (scrollToBottom && logsEndRef.current) {
          setTimeout(() => {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } else {
        setAgentLogs([]);
        setLogError("No logs available for this agent");
      }
    } catch (error) {
      console.error("Error loading agent logs:", error);
      setAgentLogs([]);
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

  // Function to format error messages and stack traces
  const formatLogMessage = (log: AgentLog) => {
    // Check if this is an error with a stack trace
    if (log.metadata?.stackTrace) {
      return (
        <div>
          <p className="text-yellow-400 text-sm font-semibold mb-2">{log.message}</p>
          <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {log.metadata.stackTrace}
          </pre>
        </div>
      );
    }
    
    // Handle messages that look like stack traces
    if (log.message.includes('at ') && log.message.includes('file://')) {
      const lines = log.message.split('\n');
      const mainMessage = lines[0];
      const stackTrace = lines.slice(1).join('\n');
      
      return (
        <div>
          <p className="text-yellow-400 text-sm font-semibold mb-2">{mainMessage}</p>
          <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {stackTrace}
          </pre>
        </div>
      );
    }
    
    // Regular message
    return <p className="text-white text-sm whitespace-pre-wrap">{log.message}</p>;
  };

  // Contract read
  const contract = getContract({
    client,
    address: "0x6ed02Bf56bEB79D47F734eE6BB4701B9789b4D5b",
    chain: scrollSepolia
  })

  // First get the agent hash by ID
  const { data: agentHash, isLoading: isAgentHashLoading } = useReadContract({
    contract,
    method: "function getAgentHashById(uint256 agentId) returns (string)",
    params: [BigInt(0)],
  });

  // Then use the hash to get agent details - use empty string if hash not available yet
  const { data: agentDetails, isLoading: isAgentDetailsLoading } = useReadContract({
    contract,
    method: "function getAgent(string memory dockerfileHash) returns (address owner, uint256 executionFee, uint256[] memory policyIds, bool isRegistered, string memory agentDockerfileHash, string memory agentLocation, string memory description, uint8 category)",
    params: [agentHash || ""],
  });

  // console.log("Agent Hash:", agentHash);
  // console.log("Agent Details:", agentDetails);

  // Extract agent data from contract if available
  const contractAgentData: AgentData = agentDetails ? {
    id: "0", // Using the ID we queried with
    name: "AAVE Agent", // This could be derived from description or set manually
    description: agentDetails[6], // description
    category: agentDetails[6],
    creationDate: new Date().toISOString().split('T')[0], // Current date as fallback
    walletAddress: agentDetails[0], // owner address
    executionFees: (Number(agentDetails[1]) / 1e18) + " ETH", // Convert wei to ETH
    avsPlugin: "Scroll", // Default value
    totalTxExecuted: "0", // Default value
    lastTxHash: "", // Default value
    agentLocation: agentDetails[5], // agentLocation
    dockerfileHash: agentDetails[4], // agentDockerfileHash
  } : {
    id: "0",
    name: "Loading...",
    description: "Loading agent data...",
    category: "Unknown",
    creationDate: "",
    walletAddress: "",
    executionFees: "",
    avsPlugin: "",
    totalTxExecuted: "",
    lastTxHash: "",
    agentLocation: "",
    dockerfileHash: ""
  };

  // Use the real data
  const displayAgentData: AgentData = contractAgentData;
  
  // Loading state for agent data
  const isLoadingAgentData = isAgentHashLoading || isAgentDetailsLoading;

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
            {isLoadingAgentData ? (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-400">Loading agent data...</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">{displayAgentData.name}</h2>
                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">{displayAgentData.description}</p>
                
                <div className="mb-3 md:mb-4 text-sm md:text-base">
                  <span className="text-gray-400">Execution Fee:</span>
                  <span className="ml-2 text-white">{displayAgentData.executionFees}</span>
                </div>
                
                <div className="text-xs md:text-sm text-gray-400 mt-2 md:mt-4">
                  Powered by <a href="#" className="text-blue-400 hover:underline">Autonome</a>
                </div>
              </>
            )}
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
          title={displayAgentData.name}
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
                  Agent Logs
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "info" ? (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">{displayAgentData.name}</h2>
                    <p className="text-gray-300">{displayAgentData.description}</p>
                    
                    <div className="mt-6 space-y-3">
                      <div>
                        <span className="text-gray-400">Category:</span>
                        <span className="ml-2 text-white">{displayAgentData.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Agent Creation Date:</span>
                        <a href="#" className="ml-2 text-blue-400 hover:underline">{displayAgentData.creationDate}</a>
                      </div>
                      <div>
                        <span className="text-gray-400">Wallet Address:</span>
                        <span className="ml-2 text-white">{displayAgentData.walletAddress}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Execution Fees:</span>
                        <span className="ml-2 text-white">{displayAgentData.executionFees}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">AVS Plugin:</span>
                        <span className="ml-2 text-white">{displayAgentData.avsPlugin}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total tx executed:</span>
                        <span className="ml-2 text-white">{displayAgentData.totalTxExecuted}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Hash of past tx:</span>
                        <a href="#" className="ml-2 text-blue-400 hover:underline">{displayAgentData.lastTxHash}</a>
                      </div>
                      {displayAgentData.dockerfileHash && (
                        <div>
                          <span className="text-gray-400">Dockerfile Hash:</span>
                          <span className="ml-2 text-white break-all">{displayAgentData.dockerfileHash}</span>
                        </div>
                      )}
                      {displayAgentData.agentLocation && (
                        <div>
                          <span className="text-gray-400">Agent Location:</span>
                          <a href={displayAgentData.agentLocation} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 hover:underline break-all">{displayAgentData.agentLocation}</a>
                        </div>
                      )}
                      <div className="md:hidden mt-4">
                        <CustomButton
                          onClick={() => setShowChatModal(true)}
                          className="w-full py-2"
                        >
                          Start Chat
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Agent Logs</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            if (logsEndRef.current) {
                              logsEndRef.current.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                        >
                          Scroll to Bottom
                        </button>
                        <button 
                          onClick={() => loadAgentLogs(true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          disabled={isLoadingLogs}
                        >
                          {isLoadingLogs ? "Loading..." : "Refresh"}
                        </button>
                      </div>
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
                      <div className="space-y-3">
                        {agentLogs.map((log) => (
                          <div key={log.id} className="bg-[#0f0f3d] p-3 rounded border border-[#1a1a4a]">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-400">{formatTimestamp(log.timestamp)}</span>
                              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${getLevelColor(log.level)} bg-opacity-20 ${log.level.toLowerCase() === 'error' ? 'bg-red-900' : log.level.toLowerCase() === 'warn' ? 'bg-yellow-900' : 'bg-blue-900'}`}>
                                {log.level.toUpperCase()}
                              </span>
                            </div>
                            {formatLogMessage(log)}
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Chatbot (Desktop only) */}
            <div className="hidden md:block md:w-1/2 h-full">
              <ChatbotCard 
                agentId={displayAgentData.id}
                agentName={displayAgentData.name}
                title={`Chat with ${displayAgentData.name}`}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile Chat Modal */}
      {showChatModal && (
        <Modal
          onClose={() => setShowChatModal(false)}
          title={`Chat with ${displayAgentData.name}`}
        >
          <div className="h-[70vh]">
            <ChatbotCard 
              agentId={displayAgentData.id}
              agentName={displayAgentData.name}
              title={`Chat with ${displayAgentData.name}`}
            />
          </div>
        </Modal>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowComingSoonModal(false)}></div>
          <div className="bg-[#1a1a4a] p-8 rounded-lg text-center max-w-md relative z-10">
            <button 
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
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
      )}
    </main>
  );
}
