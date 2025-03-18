"use client";

import React, { useState, useRef, useEffect } from "react";
import { sendMessageToAgent } from "../services/aiAgent";
import {
  useSendTransaction,
  useReadContract,
  useActiveAccount,
  useWalletBalance,
  useSendBatchTransaction,
} from "thirdweb/react";
import {
  prepareTransaction,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";
import { client, scrollSepolia } from "@/client";
import { toast } from "react-toastify";
import { taskRegistryAbi } from "@/utils/abi/taskRegistryABI";
import { Abi } from "thirdweb/utils";
import { Account } from "thirdweb/wallets";
import { encodeFunctionData, parseUnits } from "viem";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    user?: string;
    action?: string;
  };
}

interface AgentLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

interface ChatbotProps {
  agentId?: string;
  userAddress?: string;
  agentName?: string;
  executionFees?: bigint;
  creatorAddress?: string;
  height?: string;
}

interface TaskResult {
  from: string;
  to: string;
  callData: `0x${string}`;
  timestamp: bigint;
}

export default function Chatbot({
  agentId, 
  userAddress,
  agentName = "AI Assistant",
  executionFees = BigInt(0),
  creatorAddress = "0xeb0d8736Cc2c47882f112507cc8A3355d37D2413",
  height = "100%",
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [avsLogs, setAVSLogs] = useState<AgentLog[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingAVSLogs, setIsLoadingAVSLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [avsLogError, setAVSLogError] = useState<string | null>(null);
  const [isExecutingTx, setIsExecutingTx] = useState(false);
  const [currentTxUUID, setCurrentTxUUID] = useState<string | null>(null);
  const [isPreparingTx, setIsPreparingTx] = useState(false);
  const [isTxSent, setIsTxSent] = useState(false);
  const [hasShownTxSuccess, setHasShownTxSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const avsLogsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const account = useActiveAccount();
  const walletBalance = useWalletBalance({
    address: account?.address,
    chain: scrollSepolia,
    client,
  });

  const TRANSACTION_VALUE = BigInt("1000000000000000"); // 0.005 ETH

  const hasEnoughBalance = () => {
    if (!walletBalance?.data?.value || !executionFees) return false;
    const requiredAmount = TRANSACTION_VALUE + executionFees;
    return walletBalance.data.value >= requiredAmount;
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    // "Hey, I have " +
    //   walletBalance?.data?.displayValue.toString() +
    //   " " +
    //   walletBalance?.data?.symbol.toString() +
    //   " and I would like to invest. What's the best recommendation for me?",
    "Based on my smart wallet balance, whats the best investment for me?",
    "Hey, I have 10 USDC and I would like to invest. What's the best recommendation for me?",
  ]);

  // Add contract addresses at the top
  const TASK_REGISTRY_ADDRESS = "0x5e38f31693CcAcFCA4D8b70882d8b696cDc24273";
  const POLICY_COORDINATOR_ADDRESS =
    "0xbAdfD548E1D369633Cf23a53C7c8dC37607001e9";

  // Initialize contracts
  const taskRegistry = getContract({
    client,
    address: TASK_REGISTRY_ADDRESS,
    chain: scrollSepolia,
    abi: taskRegistryAbi as Abi,
  });

  const policyCoordinator = getContract({
    client,
    address: POLICY_COORDINATOR_ADDRESS,
    chain: scrollSepolia,
  });

  const { mutate: sendBatchTransaction, data: batchTxData } =
    useSendBatchTransaction();

  // Watch for transaction hash in batchTxData
  useEffect(() => {
    console.log("batchTxData", batchTxData);
    if (batchTxData?.transactionHash && !hasShownTxSuccess) {
      // Update message with transaction hash immediately
      const txMessage: Message = {
        role: "assistant",
        content: `Transaction submitted successfully!\n\nCheck at ScrollScan: https://sepolia.scrollscan.com/tx/${
          batchTxData.transactionHash
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), txMessage]);

      // Open explorer in new tab immediately
      const explorerUrl = `https://sepolia.scrollscan.com/tx/${batchTxData.transactionHash}`;
      window.open(explorerUrl, "_blank", "noopener,noreferrer");

      //enable the button by removing the disabled attribute
      document
        .getElementById("send-message-input")
        ?.removeAttribute("disabled");

      // Mark that we've shown the success message
      setHasShownTxSuccess(true);
    }
  }, [batchTxData, hasShownTxSuccess]);

  // Reset hasShownTxSuccess when starting a new transaction
  useEffect(() => {
    if (isPreparingTx) {
      setHasShownTxSuccess(false);
    }
  }, [isPreparingTx]);

  // Get task details using useReadContract
  //@ts-ignore
  const { data: taskDetails, isLoading: isTaskLoading } = useReadContract({
    contract: taskRegistry,
    method: "getTask",
    params: [currentTxUUID as `0x${string}`],
  }) as { data: TaskResult | undefined; isLoading: boolean };

  // Check policy approval using useReadContract
  const { data: isPolicyApproved, isLoading: isPolicyLoading } =
    useReadContract({
      contract: policyCoordinator,
      method:
        "function getValidationStatus(string taskUuid) returns (string memory status, string memory reason)",
      params: [currentTxUUID as `0x${string}`],
    });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Add a welcome message when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Example response format from the agent
      const welcomeMessage: Message = {
        role: "assistant",
        content: `Hello! I'm ${agentName}. How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [agentName, messages.length]);

  // Update currentTxUUID whenever messages change
  useEffect(() => {
    const txUUID = getLastAgentTxUUID();
    setCurrentTxUUID(txUUID);
  }, [messages]);

  // Function to generate contextual follow-up questions based on agent's response
  const generateFollowUpQuestions = (agentMessage: string): string[] => {
    // Default questions if no specific context is detected
    const defaultQuestions = [
      "Can you explain more about the risks involved?",
      "What are the potential returns?",
      "How long should I hold this investment?",
    ];

    // Check for specific contexts in the agent's message and provide relevant follow-ups
    if (
      agentMessage.includes(
        "I'd be happy to help you with an investment plan for Aave. Could you please tell me which asset you're interested in (WBTC, USDC, DAI, etc.) and how much you're planning to invest?"
      ) ||
      agentMessage.includes("which asset")
    ) {
      return [
        "I prefer something that is low risk",
        "What's the best option for high returns?",
        "I'm interested in USDC",
        "Tell me more about WBTC",
      ];
    }

    if (agentMessage.includes("risk")) {
      return [
        "I prefer low-risk investments",
        "I'm comfortable with moderate risk",
        "I'm looking for high-risk, high-reward options",
      ];
    }

    return defaultQuestions;
  };

  // Function to check if message contains a transaction UUID
  const extractTxUUID = (message: string) => {
    // Match any string between txUUID: and the next whitespace or end of line
    const match = message.match(/txUUID: ([^\s\n]+)/);
    return match ? match[1] : null;
  };

  // Function to check if there's a transaction UUID in the last agent message
  const getLastAgentTxUUID = () => {
    if (messages.length === 0) return null;
    const lastAgentMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant");
    return lastAgentMessage ? extractTxUUID(lastAgentMessage.content) : null;
  };

  // Function to handle transaction execution
  const handleTransactionExecution = async () => {
    // if (!hasEnoughBalance()) {
    //   const requiredAmount = formatWeiToEth(TRANSACTION_VALUE + executionFees);
    //   const errorMessage: Message = {
    //     role: "assistant",
    //     content: `Insufficient balance. You need at least ${requiredAmount} to cover both the transaction value and execution fee.`,
    //     timestamp: new Date(),
    //   };
    //   setMessages((prev) => [...prev, errorMessage]);
    //   return;
    // }

    if (!creatorAddress) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Creator address not found. Cannot send execution fee.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    setIsExecutingTx(true);
    setIsPreparingTx(true);
    try {
      // Check if we have valid task details and policy approval
      if (!taskDetails || !isPolicyApproved) {
        throw new Error(
          !taskDetails
            ? "Task not found or invalid task details"
            : "Task not approved by policy"
        );
      }

      console.log("taskDetails", taskDetails);

      // Get the user's address from the account
      if (!account?.address) {
        throw new Error("User account not found");
      }

      let calldata = taskDetails.callData as `0x${string}`;

      console.log("calldata original", calldata);

      // Prepare both transactions
      const transactions = [
        prepareTransaction({
          to: "0x2C9678042D52B97D27f2bD2947F7111d93F3dD0D",
          data: "0x095ea7b300000000000000000000000048914c788295b5db23af2b5f0b3be775c4ea9440ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          chain: scrollSepolia,
          client: client,
          value: BigInt(0),
        }),
        prepareTransaction({
          to: taskDetails.to,
          data: calldata, // Fix: Remove quotes to use the actual newCalldata value
          chain: scrollSepolia,
          client: client,
          value: BigInt(0),
        }),
        prepareTransaction({
          to: creatorAddress as `0x${string}`,
          chain: scrollSepolia,
          client: client,
          value: executionFees,
        }),
      ];

      console.log("transactions", transactions);

      setIsPreparingTx(false);
      setIsTxSent(true);

      // Add processing message first
      // const processingMessage: Message = {
      //   role: "assistant",
      //   content: `Processing transaction...\n\nTransaction Details:\nMain Transaction Value: ${formatWeiToEth(
      //     TRANSACTION_VALUE
      //   )}\nExecution Fee: ${formatWeiToEth(executionFees)}`,
      //   timestamp: new Date(),
      // };
      // setMessages((prev) => [...prev, processingMessage]);
      //disable the button
      document
        .getElementById("send-message-input")
        ?.setAttribute("disabled", "true");

      // Send batch transaction
      await sendBatchTransaction(transactions);
    } catch (error) {
      console.error("Transaction error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Transaction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsExecutingTx(false);
      setIsPreparingTx(false);
      setIsTxSent(false);
    }
  };

  // Modify the handleSendMessage function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatEnded) return;

    // Check if there's a pending transaction to execute
    if (currentTxUUID && input.trim().toLowerCase() === "execute") {
      await handleTransactionExecution();
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Regular chat message handling...
      const response = await sendMessageToAgent(input, agentId);
      // Process the response (which is now always an array of items)
      if (Array.isArray(response)) {
        response.forEach((item) => {
          const assistantMessage: Message = {
            role: "assistant",
            content: item.text,
            timestamp: new Date(),
            metadata: {
              user: item.user,
              action: item.action,
            },
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Generate new suggested questions based on the response content
          setSuggestedQuestions(generateFollowUpQuestions(item.text));

          // Check if the chat should end
          if (item.action === "END") {
            setIsChatEnded(true);
          }
        });
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content:
            response.response ||
            "Sorry, I received an unexpected response format. Please try again.",
          timestamp: new Date(),
          metadata: response.metadata,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Generate new suggested questions based on the response content
        // Use metadata.suggestedQuestions if available, otherwise generate them
        if (response.metadata?.suggestedQuestions) {
          setSuggestedQuestions(response.metadata.suggestedQuestions);
        } else {
          setSuggestedQuestions(generateFollowUpQuestions(response.response));
        }
      }

      // Check if the chat should end
      if (response.metadata?.action === "END") {
        setIsChatEnded(true);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeiToEth = (wei: bigint): string => {
    return (Number(wei) / 1e18).toFixed(3) + " ETH";
  };

  // Function to render the send/execute button with appropriate styling
  const renderExecuteButton = () => {
//     if (!hasEnoughBalance()) {
//       const tooltipText = `Required: ${formatWeiToEth(
//         TRANSACTION_VALUE + executionFees
//       )}
// Transaction Value: ${formatWeiToEth(TRANSACTION_VALUE)}
// Execution Fee: ${formatWeiToEth(executionFees)}
// Your Balance: ${walletBalance?.data?.displayValue || "0"} ${
//         walletBalance?.data?.symbol || "ETH"
//       }`;

//       return (
//         <button
//           disabled
//           className="min-w-[140px] bg-red-500/90 backdrop-blur-sm text-white font-medium rounded-xl px-4 py-2 
//           transition-all duration-200 h-[44px] opacity-75 flex items-center justify-center gap-2 
//           border border-red-400/20"
//           title={tooltipText}
//         >
//           Insufficient Balance
//         </button>
//       );
//     }

    if (isTaskLoading || isPolicyLoading) {
      return (
        <button
          disabled
          className="min-w-[140px] bg-green-500/90 backdrop-blur-sm text-white font-medium rounded-xl px-4 py-2 
          transition-all duration-200 h-[44px] opacity-75 flex items-center justify-center gap-2 
          border border-green-400/20"
        >
          <span className="animate-spin">⟳</span>
          Validating Task...
        </button>
      );
    }

    if (isPreparingTx) {
      return (
        <button
          disabled
          className="min-w-[140px] bg-green-500/90 backdrop-blur-sm text-white font-medium rounded-xl px-4 py-2 
          transition-all duration-200 h-[44px] opacity-75 flex items-center justify-center gap-2 
          border border-green-400/20"
        >
          <span className="animate-spin">⟳</span>
          Preparing Transaction...
        </button>
      );
    }

    if (isTxSent) {
      return (
        <button
          disabled
          className="min-w-[140px] bg-green-500/90 backdrop-blur-sm text-white font-medium rounded-xl px-4 py-2 
          transition-all duration-200 h-[44px] opacity-75 flex items-center justify-center gap-2 
          border border-green-400/20"
        >
          <span className="animate-spin">⟳</span>
          Sending Transaction...
        </button>
      );
    }

    return (
      <button
        type="submit"
        onClick={() => handleTransactionExecution()}
        className="min-w-[140px] bg-green-500/90 backdrop-blur-sm text-white font-medium rounded-xl 
        px-4 py-2 transition-all duration-200 h-[44px] flex items-center justify-center gap-2
        hover:bg-green-500 border border-green-400/20 disabled:opacity-50 disabled:hover:bg-green-500/90"
        disabled={isLoading || isChatEnded}
      >
        Execute
      </button>
    );
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Function to handle clicking a suggested question
  const handleSuggestedQuestion = (question: string) => {
    if (isChatEnded) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Process the question just like a normal message
    sendMessageToAgent(question, agentId)
      .then((response) => {
        // Process the response (which is now always an array of items)
        if (Array.isArray(response)) {
          response.forEach((item) => {
            const assistantMessage: Message = {
              role: "assistant",
              content: item.text,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          });
        } else if (process.env.NODE_ENV === "development") {
          console.log("Unexpected response format:", response);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        setIsLoading(false);
      });
  };

  return (
    <div style={{ height }} className="flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-yellow-500 text-black"
                    : "bg-[#1a1a4a] text-white"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
                <div className="text-xs mt-1 opacity-70 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a4a] text-white rounded-lg p-3 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {!isLoading &&
          !isChatEnded &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant" && (
            <div className="px-4 pb-3">
              <div className="text-yellow-200 text-sm mb-2">
                You might want to ask:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="bg-[#2a2a5a] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#3a3a6a] transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Input Area */}
        <div className="p-4 bg-[#1a1a4a]/50 border-t border-white/5">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-[#2a2a6a]/50 p-2 rounded-2xl backdrop-blur-sm border border-white/10"
          >
            <textarea
              id="send-message-input"
              ref={inputRef}
              className="flex-1 bg-transparent text-white px-4 py-2 outline-none resize-none
              overflow-y-auto h-auto min-h-[44px] max-h-[200px] placeholder:text-white/50"
              placeholder={
                isChatEnded ? "Chat has ended" : "Type your message..."
              }
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isChatEnded}
            />
            {currentTxUUID ? (
              renderExecuteButton()
            ) : (
              <button
                type="submit"
                id="send-message-input"
                className="min-w-[100px] bg-yellow-500/90 backdrop-blur-sm text-black font-medium 
                rounded-xl px-4 py-2 transition-all duration-200 h-[44px] flex items-center justify-center
                hover:bg-yellow-500 border border-yellow-400/20 disabled:opacity-50"
              >
                Send
              </button>
            )}
          </form>
          {isChatEnded && (
            <p className="text-yellow-200/90 text-sm mt-3 text-center">
              This conversation has ended. Start a new chat to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
