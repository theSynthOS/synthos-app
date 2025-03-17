"use client";
import { useState, useRef, useEffect } from "react";
import CustomButton from "../components/buttons/mainButton";
import ChatbotCard from "../components/chatbotCard";
import { fetchAgentLogs } from "../services/aiAgent";
import Modal from "../components/detailModal";
import { motion } from "framer-motion";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { getContract, prepareContractCall } from "thirdweb";
import {
  useActiveAccount,
  useReadContract,
  TransactionButton,
  useWalletBalance,
} from "thirdweb/react";
import { scrollSepolia } from "@/client";
import { client } from "@/client";
import { isLoggedIn } from "../actions/login";
import confetti from "canvas-confetti";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@/components/card/page";

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
  executionFees: bigint;
  avsPlugin: string;
  totalTxExecuted: string;
  lastTxHash: string;
  dockerfileHash?: string;
  agentLocation?: string;
}

interface AVSPolicyData {
  name: string;
  description: string;
  whenCondition: any;
  howCondition: any;
  whatCondition: any;
  isActive: boolean;
  creator: string;
}

const faucet = getContract({
  address: "0x602396FFA43b7FfAdc80e01c5A11fc74F3BA59f5",
  chain: scrollSepolia,
  client: client,
});

const formatWeiToEth = (wei: bigint): string => {
  return (Number(wei) / 1e18).toFixed(3) + " ETH";
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"info" | "logs">("info");
  const [showModal, setShowModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showConditions, setShowConditions] = useState(false);
  const account = useActiveAccount();

  // Get wallet balance
  const { data: balance } = useWalletBalance({
    address: account?.address,
    chain: scrollSepolia,
    client,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      setIsAuthenticated(loggedIn);
    };
    checkAuth();
  }, []);

  // Add new effect to watch for account changes
  useEffect(() => {
    if (account) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [account]);

  useEffect(() => {
    if (showModal && activeTab === "logs") {
      // Initial load of logs
      loadAVSLogs();
      
      // Set up SSE connection for real-time logs
      const eventSource = setupLogStream();
      
      // Clean up SSE connection when component unmounts or tab changes
      return () => {
        if (eventSource) {
          console.log("Closing SSE connection");
          eventSource.close();
        }
      };
    }
  }, [showModal, activeTab]);

  // Contract read agent details
  const contract = getContract({
    client,
    address: "0x6ed02Bf56bEB79D47F734eE6BB4701B9789b4D5b",
    chain: scrollSepolia
  })

// Contract read AVS 
const avsContract = getContract({
  client,
  address: "0xa7B0446a0Fa8e8c503774987931E071E3DdF271A",
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

  // Log the agent details and policy ID for debugging
  useEffect(() => {
    if (agentDetails) {
      console.log("Agent Details:", agentDetails);
      console.log("Policy IDs:", agentDetails[2]);
    }
  }, [agentDetails]);

  // Contract read AVS details - use the correct method signature
  const { data: avsDetails, isLoading: isAVSLoading } = useReadContract({
    contract: avsContract,
    method: "getPolicyMetadata(uint256)",
    params: [BigInt(1)]
  });
console.log("AVS Details:", avsDetails);

  // Mock AVS policy data to use when real data is not available
  const mockAVSPolicyData: AVSPolicyData = {
    name: "AAVE Complete AVS Plugin",
    description: "This plugin allows for the supply, borrow, repay, withdraw and deposit actions to be done for the Scroll AAVE Market",
    whenCondition: "0.0",
    howCondition: "0x7b2270726f746f636f6c223a224141564522",
    whatCondition: "0x7b2261637469766974696573223a5b227375707073796c79222c22626f72726f77222c227265706179222c2277697468647261772c2264657073697422225d7d",
    isActive: true,
    creator: "0x1234567890123456789012345678901234567890"
  };

  // Get the AVS policy data with fallback to mock data
  const avsPolicyData: AVSPolicyData | null = avsDetails ? {
    name: avsDetails[0] as string || "",
    description: avsDetails[1] as string || "",
    whenCondition: avsDetails[2] || "",
    howCondition: avsDetails[3] || "",
    whatCondition: avsDetails[4] || "",
    isActive: avsDetails[5] as boolean || false,
    creator: avsDetails[6] as string || ""
  } : mockAVSPolicyData;

  // Extract agent data from contract if available
  const contractAgentData: AgentData = agentDetails ? {
    id: "0", // Using the ID we queried with
    name: "AAVE Agent", // This could be derived from description or set manually
    description: agentDetails[6], // description
    category: "DeFi",
    creationDate: new Date().toISOString().split('T')[0], // Current date as fallback
    walletAddress: agentDetails[0], // owner address
    executionFees: (Number(agentDetails[1]) / 1e18) + " ETH", // Convert wei to ETH
    avsPlugin: avsPolicyData?.name || "", // Use AVS policy name if available
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
    dockerfileHash: "",
  };

  // Setup SSE connection for real-time logs
  const setupLogStream = () => {
    if (typeof window === 'undefined') return null;
    
    console.log("Setting up SSE connection for logs");
    const eventSource = new EventSource('/api/agent-logs/stream');
    
    eventSource.onopen = () => {
      console.log("SSE connection opened");
      setIsLoadingLogs(false);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const logEntry = JSON.parse(event.data);
        console.log("SSE log received:", logEntry);
        
        // Add the new log to the state
        setAgentLogs(prevLogs => {
          // Add the new log to the beginning of the array
          const newLogs = [logEntry, ...prevLogs];
          
          // Sort logs by timestamp (newest first)
          const sortedLogs = newLogs.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          // Limit to 100 logs to prevent performance issues
          return sortedLogs.slice(0, 100);
        });
        
        // Clear any error message
        setLogError(null);
      } catch (error) {
        console.error("Error parsing SSE log:", error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setLogError("Error in log stream connection");
      eventSource.close();
    };
    
    return eventSource;
  };

  const loadAVSLogs = async (scrollToBottom = false) => {
    setIsLoadingLogs(true);
    setLogError(null);

    try {
      const logs = await fetchAgentLogs();
      
      if (logs && logs.length > 0) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...logs].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Limit to 50 logs to prevent performance issues
        const limitedLogs = sortedLogs.slice(0, 50);
        
        setAgentLogs(limitedLogs);
        setLogError(null);

        // Only scroll to bottom if explicitly requested
        if (scrollToBottom && logsEndRef.current) {
          setTimeout(() => {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      } else {
        setAgentLogs([]);
        setLogError("No AVS logs available");
      }
    } catch (error) {
      console.error("Error loading AVS logs:", error);
      setAgentLogs([]);
      setLogError("Failed to load AVS logs");
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
          <p className="text-yellow-400 text-sm font-semibold mb-2">
            {log.message}
          </p>
          <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {log.metadata.stackTrace}
          </pre>
        </div>
      );
    }

    // Handle messages that look like stack traces
    if (log.message.includes("at ") && log.message.includes("file://")) {
      const lines = log.message.split("\n");
      const mainMessage = lines[0];
      const stackTrace = lines.slice(1).join("\n");

      return (
        <div>
          <p className="text-yellow-400 text-sm font-semibold mb-2">
            {mainMessage}
          </p>
          <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {stackTrace}
          </pre>
        </div>
      );
    }

    // Handle JSON messages
    if (log.message.startsWith("{") && log.message.endsWith("}")) {
      try {
        const jsonData = JSON.parse(log.message);
        return (
          <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        );
      } catch (e) {
        // Not valid JSON, continue with regular message
      }
    }

    // Regular message
    return (
      <p className="text-white text-sm whitespace-pre-wrap">{log.message}</p>
    );
  };

  // Contract read
  const contract = getContract({
    client,
    address: "0x6ed02Bf56bEB79D47F734eE6BB4701B9789b4D5b",
    chain: scrollSepolia,
  });

  // First get the agent hash by ID
  const { data: agentHash, isLoading: isAgentHashLoading } = useReadContract({
    contract,
    method: "function getAgentHashById(uint256 agentId) returns (string)",
    params: [BigInt(0)],
  });

  // Then use the hash to get agent details - use empty string if hash not available yet
  const { data: agentDetails, isLoading: isAgentDetailsLoading } =
    useReadContract({
      contract,
      method:
        "function getAgent(string memory dockerfileHash) returns (address owner, uint256 executionFee, uint256[] memory policyIds, bool isRegistered, string memory agentDockerfileHash, string memory agentLocation, string memory description, uint8 category)",
      params: [agentHash || ""],
    });

  // Extract agent data from contract if available
  const contractAgentData: AgentData = agentDetails
    ? {
        id: "0", // Using the ID we queried with
        name: "AAVE Agent", // This could be derived from description or set manually
        description: agentDetails[6], // description
        category: "DeFi",
        creationDate: new Date().toISOString().split("T")[0], // Current date as fallback
        walletAddress: agentDetails[0], // owner address
        executionFees: agentDetails[1],
        avsPlugin: "Scroll", // Default value
        totalTxExecuted: "0", // Default value
        lastTxHash: "", // Default value
        agentLocation: agentDetails[5], // agentLocation
        dockerfileHash: agentDetails[4], // agentDockerfileHash
      }
    : {
        id: "0",
        name: "Loading...",
        description: "Loading agent data...",
        category: "Unknown",
        creationDate: "",
        walletAddress: "",
        executionFees: BigInt(0),
        avsPlugin: "",
        totalTxExecuted: "",
        lastTxHash: "",
        agentLocation: "",
        dockerfileHash: "",
      };

  // Use the real data
  const displayAgentData: AgentData = contractAgentData;

  // Loading state for agent data
  const isLoadingAgentData = isAgentHashLoading || isAgentDetailsLoading;

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center space-grotesk relative">
        <motion.div style={{ opacity: 1 }} className="absolute inset-0">
          <BackgroundGradientAnimation containerClassName="absolute inset-0 z-0" />
        </motion.div>

        <div className="relative z-10 text-center p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-gray-700">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 text-yellow-500">
            Scroll&apos;s #1 Verifiable DeFAI Agent Marketplace
          </h1>
          <p className="text-yellow-200 text-lg">
            <div className="animate-pulse bg-yellow-500/20 rounded-lg px-4 py-2 inline-block">
              Sign in to get started<span className="ml-2">🤖</span>
            </div>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col space-grotesk relative`}>
      <motion.div style={{ opacity: 1 }} className="absolute inset-0">
        <BackgroundGradientAnimation containerClassName="absolute inset-0 z-0" />
      </motion.div>

      {/* Banner Area */}
      <div className="relative z-10 pt-[76px] md:pt-[86px] flex flex-col items-center justify-center min-h-[40vh] bg-white/5 backdrop-blur-sm">
        <div className="w-full text-center">
          <div className="flex justify-end px-4 mb-4"></div>
          <h1 className="text-xl md:text-4xl font-bold mb-4 text-yellow-500 pt-5">
            Verifiable DeFAI Agent Marketplace on Scroll
          </h1>
          <p className="text-yellow-200 text-lg mb-4 md:text-2xl font-medium">
            Discover, deploy, and manage AI agents
          </p>
          <div className="flex justify-center items-center gap-8">
            <CustomButton
              onClick={() => setShowComingSoonModal(true)}
              className="mt-4 px-8 py-2 text-xl"
            >
          Create Agent
            </CustomButton>

            <CustomButton
              onClick={() =>
                window.open(
                  "https://www.notion.so/SynthOS-Automate-Your-Gains-19618bd263f08027993cfa6c5618941d",
                  "_blank"
                )
              }
              className="mt-4 px-8 py-2 text-xl"
            >
              Documentation
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Feature Agent Area */}
      <div className="relative z-10 px-4 md:px-8 py-6 w-full">
        <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl md:text-4xl font-bold text-yellow-400">
              Featured Agents
            </h1>
            <div className="flex items-center gap-2">
              <TransactionButton
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                transaction={() =>
                  prepareContractCall({
                    contract: faucet,
                    method: "function requestDrip()",
                    params: [],
                  })
                }
                onClick={() => {
                  toast.info("Preparing transaction...", {
                    position: "bottom-right",
                    autoClose: 3000,
                  });
                }}
                onTransactionSent={(tx) => {
                  toast.success(
                    "Transaction sent! Waiting for confirmation...",
                    {
                      position: "bottom-right",
                      autoClose: 5000,
                    }
                  );
                }}
                onTransactionConfirmed={(receipt) => {
                  toast.success(
                    "🎉 Transaction confirmed! Funds claimed successfully!",
                    {
                      position: "bottom-right",
                      autoClose: 5000,
                    }
                  );
                  // Trigger confetti
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                  });
                }}
                onError={(error) => {
                  const cleanErrorMessage = error.message
                    .split("contract:")[0]
                    .trim();
                  toast.error(cleanErrorMessage, {
                    position: "bottom-right",
                    autoClose: 5000,
                  });
                }}
              >
                Claim Test Funds
              </TransactionButton>
            </div>
          </div>
        </div>

        {/* Add ToastContainer for notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

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
                <h2 className="text-xl md:text-2xl font-bold text-yellow-300 mb-2 md:mb-3">{displayAgentData.name}</h2>
                <p className="text-gray-200/90 mb-3 md:mb-4 text-sm md:text-base">{displayAgentData.description}</p>
                
                <div className="mb-3 md:mb-4 text-sm md:text-base">
                  <span className="text-gray-400">Execution Fee:</span>
                  <span className="ml-2 text-white">
                    {formatWeiToEth(displayAgentData.executionFees)}
                  </span>
                </div>
                
                <div className="text-xs md:text-sm text-yellow-200 mt-2 md:mt-4">
                  Powered by:  <a href="#" className="text-white hover:underline">Autonome</a>
                </div>
              </>
            )}
          </div>

          {/* Add Your Agent Card */}
          <div 
            className="bg-white/5 backdrop-blur-sm border border-dashed border-gray-700 rounded-lg p-4 md:p-6 flex items-center justify-center hover:border-yellow-500 transition-colors cursor-pointer"
            onClick={() => setShowComingSoonModal(true)}
          >
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-400 mb-1 md:mb-2 ">
                Create Agent
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Create a new agent
              </p>
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
                  className={`px-4 py-2 font-medium ${
                    activeTab === "info"
                      ? "text-yellow-200 border-b-2 border-yellow-200"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("info")}
                >
                  Info
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "logs"
                      ? "text-yellow-200 border-b-2 border-yellow-200"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  onClick={() => setActiveTab("logs")}
                >
                  AVS Logs
                </button>
            </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "info" ? (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">{displayAgentData.name}</h2>
                    <p className="text-white">{displayAgentData.description}</p>
                    
                    <h2 className="text-2xl font-bold text-white">
                      {displayAgentData.name}
                    </h2>
                    <p className="text-gray-300">
                      {displayAgentData.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      <Card className="bg-yellow-200">
                        <span className="text-yellow-700 font-bold">Category:</span>
                        <span className="ml-2 text-yellow-900">{displayAgentData.category}</span>
                      </Card>
                      <Card className="border border-dashed border-yellow-200">
                        <span className="text-white font-bold">Agent Creation Date:</span>
                        <a href="#" className="ml-2 text-yellow-200">{displayAgentData.creationDate}</a>
                      </Card>
                      <Card className="border border-dashed border-yellow-200">
                        <span className="text-white font-bold">Wallet Address:</span>
                        <pre className="ml-2 text-yellow-200">{displayAgentData.walletAddress}</pre>
                      </Card>
                      <Card className="border border-dashed border-yellow-200">
                        <span className="text-white font-bold">Execution Fees:</span>
                        <span className="ml-2 text-yellow-200">{displayAgentData.executionFees}</span>
                      </Card>
                      <Card className="bg-yellow-200">
                        <span className="text-yellow-600 font-bold">AVS Plugin:</span>
                        <span className="ml-2 text-yellow-900">{displayAgentData.avsPlugin || ""}</span>
                      </Card>
                      {avsPolicyData && (
                        <>
                          <Card className="border border-dashed border-yellow-200">
                            <span className="text-white font-bold">AVS Policy Description:</span>
                            <span className="ml-2 text-yellow-200">{avsPolicyData.description}</span>
                          </Card>
                          <Card className="border border-dashed border-yellow-200">
                            <span className="text-gray-400">AVS Policy Status:</span>
                            <span className={`ml-2 ${avsPolicyData.isActive ? "text-green-400" : "text-red-400"}`}>
                              {avsPolicyData.isActive ? "Active" : "Inactive"}
                            </span>
                          </Card>
                          <Card className="border border-dashed border-yellow-200">
                            <span className="text-white font-bold">AVS Policy Creator:</span>
                            <a 
                              href={`https://sepolia.scrollscan.dev/address/${avsPolicyData.creator}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ml-2 text-yellow-200 hover:underline break-all"
                            >
                              {avsPolicyData.creator}
                            </a>
                          </Card>
                          
                          {/* Collapsible Conditions Section */}
                          <div className="mt-4">
                            <button 
                              onClick={() => setShowConditions(!showConditions)}
                              className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                              <span className="mr-2">{showConditions ? '▼' : '►'}</span>
                              <span>AVS Policy Conditions</span>
                            </button>
                            
                            {showConditions && (
                              <div className="mt-3 pl-4 border-l-2 border-gray-700 space-y-4">
                                {/* When Condition */}
                                <div>
                                  <h4 className="text-yellow-200 font-medium mb-1">When Condition</h4>
                                  <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
                                    {JSON.stringify(avsPolicyData.whenCondition, null, 2) || "0.0"}
                                  </pre>
                                </div>
                                
                                {/* How Condition */}
                                <div>
                                  <h4 className="text-yellow-200 font-medium mb-1">How Condition</h4>
                                  <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
                                    {JSON.stringify(avsPolicyData.howCondition, null, 2)}
                                  </pre>
                                </div>
                                
                                {/* What Condition */}
                                <div>
                                  <h4 className="text-yellow-200 font-medium mb-1">What Condition</h4>
                                  <pre className="bg-[#1a1a4a] p-2 rounded text-xs text-gray-300 overflow-x-auto">
                                    {JSON.stringify(avsPolicyData.whatCondition, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      <Card className="border border-dashed border-yellow-200">
                        <span className="text-white font-bold">Total tx executed:</span>
                        <span className="ml-2 text-yellow-200">{displayAgentData.totalTxExecuted}</span>
                      </Card>
                      <Card className="border border-dashed border-yellow-200">
                        <span className="text-white">Hash of past tx:</span>
                        <a href="#" className="ml-2 text-blue-400 hover:underline">{displayAgentData.lastTxHash || "No transactions yet"}</a>
                      </Card>
                      {displayAgentData.dockerfileHash && (
                        <Card className="border border-dashed border-yellow-200">
                          <span className="text-white font-bold">Dockerfile Hash:</span>
                          <span className="ml-2 text-yellow-200 break-all">{displayAgentData.dockerfileHash}</span>
                        </Card>
                      )}
                      {displayAgentData.agentLocation && (
                        <Card className="border border-dashed border-yellow-200">
                          <span className="text-white">Agent Location:</span>
                          <a href={displayAgentData.agentLocation} target="_blank" rel="noopener noreferrer" className="ml-2 text-yellow-200 hover:underline break-all">{displayAgentData.agentLocation}</a>
                        </Card>
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
                      <h3 className="text-xl font-bold text-white">AVS Logs</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (logsEndRef.current) {
                              logsEndRef.current.scrollIntoView({
                                behavior: "smooth",
                              });
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                        >
                          Scroll to Bottom
                        </button>
                        <button
                          onClick={() => loadAVSLogs(true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          disabled={isLoadingLogs}
                        >
                          {isLoadingLogs ? "Loading..." : "Refresh"}
                        </button>
                      </div>
                    </div>

                    {isLoadingLogs ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mb-2"></div>
                        <p className="text-gray-400">Loading logs...</p>
                      </div>
                    ) : logError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400">{logError}</p>
                      </div>
                    ) : agentLogs.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-400">No AVS logs available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agentLogs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-[#0f0f3d] p-3 rounded border border-[#1a1a4a]"
                          >
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-400">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              <span
                                className={`font-medium px-2 py-0.5 rounded-full text-xs ${getLevelColor(
                                  log.level
                                )} bg-opacity-20 ${
                                  log.level.toLowerCase() === "error"
                                    ? "bg-red-900"
                                    : log.level.toLowerCase() === "warn"
                                    ? "bg-yellow-900"
                                    : "bg-blue-900"
                                }`}
                              >
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
                executionFees={displayAgentData.executionFees}
                creatorAddress={displayAgentData.walletAddress}
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
              executionFees={displayAgentData.executionFees}
              creatorAddress={displayAgentData.walletAddress}
            />
          </div>
        </Modal>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowComingSoonModal(false)}
          ></div>
          <div className="bg-[#1a1a4a] p-8 rounded-lg text-center max-w-md relative z-10">
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-yellow-200 mb-4">
              Upcoming in V2
            </h2>
            <p className="text-gray-200 mb-6">
              We&apos;re working hard to bring you the ability to create and
              deploy your own agents. This feature will be available in our next
              major release.
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
