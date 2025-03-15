"use client";

import React, { useState, useRef, useEffect } from "react";
import { Gluten } from "next/font/google";
import { sendMessageToAgent, fetchAgentLogs, fetchAVSLogs } from "../services/aiAgent";

const gluten = Gluten({
  subsets: ["latin"],
  variable: "--font-gluten",
  weight: ["400", "700"],
});

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
  agentName?: string;
  height?: string;
}

export default function Chatbot({ 
  agentId, 
  agentName = "AI Assistant",
  height = "100%" 
}: ChatbotProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "log" | "avs">("chat");
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const avsLogsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Hey, I have $1000 and I would like to invest. What's the best recommendation for me?",
    "Based on my smart wallet balance, whats the best investment for me?",
  ]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  // Auto-scroll to bottom of AVS logs
  useEffect(() => {
    avsLogsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [avsLogs]);

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

  // Fetch agent logs when the log tab is activated
  useEffect(() => {
    if (activeTab === "log" && agentLogs.length === 0) {
      loadAgentLogs();
    } else if (activeTab === "avs" && avsLogs.length === 0) {
      loadAVSLogs();
    }
  }, [activeTab, agentLogs.length, avsLogs.length]);


  // AGENT LOG
  const loadAgentLogs = async () => {
    setIsLoadingLogs(true);
    setLogError(null);
    
    try {
      // Use a valid UUID format for the agent ID
      // The error shows that "2" is not a valid UUID format
      const validAgentId = "d7d9277b-850a-44a1-84e1-8506e9488f33";
      console.log('Loading agent logs for ID:', validAgentId);
      
      const logs = await fetchAgentLogs();
      console.log('Logs received in component:', logs);
      
      if (logs && logs.length > 0) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...logs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setAgentLogs(sortedLogs);
        console.log('Successfully set agent logs:', sortedLogs.length, 'entries');
      } else {
        console.warn('No logs returned from API');
        setLogError('No logs available for this agent. You may not have permission to view logs or the agent has not generated any logs yet.');
      }
    } catch (error) {
      console.error("Error loading agent logs:", error);
      setLogError(`Error loading logs: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // AVS LOG
  const loadAVSLogs = async () => {
    setIsLoadingAVSLogs(true);
    setAVSLogError(null);
    
    try {
      console.log('Loading AVS logs');
      
      const logs = await fetchAVSLogs();
      console.log('AVS logs received in component:', logs);
      
      if (logs && logs.length > 0) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = [...logs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setAVSLogs(sortedLogs);
        console.log('Successfully set AVS logs:', sortedLogs.length, 'entries');
      } else {
        console.warn('No AVS logs returned from API');
        setAVSLogError('No AVS logs available. You may not have permission to view logs or no logs have been generated yet.');
      }
    } catch (error) {
      console.error("Error loading AVS logs:", error);
      setAVSLogError(`Error loading AVS logs: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingAVSLogs(false);
    }
  };

  // Function to generate contextual follow-up questions based on agent's response
  const generateFollowUpQuestions = (agentMessage: string): string[] => {
    // Default questions if no specific context is detected
    const defaultQuestions = [
      "Can you explain more about the risks involved?",
      "What are the potential returns?",
      "How long should I hold this investment?"
    ];
    
    // Check for specific contexts in the agent's message and provide relevant follow-ups
    if (agentMessage.includes("I'd be happy to help you with an investment plan for Aave. Could you please tell me which asset you're interested in (WBTC, USDC, DAI, etc.) and how much you're planning to invest?") || agentMessage.includes("which asset")) {
      return [
        "I prefer something that is low risk",
        "What's the best option for high returns?",
        "I'm interested in USDC",
        "Tell me more about WBTC"
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatEnded) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the AI agent service
      const response = await sendMessageToAgent(input, agentId);

      if (process.env.NODE_ENV === 'development') {
        console.log("GOES HEREEEEE");
        response.map((item: any) => {
          console.log("item: ", item);
          const assistantMessage: Message = {
            role: "assistant",
            content: item.text,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          
          // Generate new suggested questions based on the response content
          setSuggestedQuestions(generateFollowUpQuestions(item.text));
        })
      } else {
        console.log("GOES HERE ELSE");
        const assistantMessage: Message = {
          role: "assistant",
          content: response.response,
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
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          console.log("GOES HEREEEEE");
          response.map((item: any) => {
            console.log("item: ", item);
            const assistantMessage: Message = {
              role: "assistant",
              content: item.text,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            
            // Generate new suggested questions based on the response content
            setSuggestedQuestions(generateFollowUpQuestions(item.text));
          })
        } else {
          console.log("GOES HERE ELSE");
          const assistantMessage: Message = {
            role: "assistant",
            content: response.response,
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
      })
      .catch(error => {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again later.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Format log level with appropriate color
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  // Render logs (used for both agent and AVS logs)
  const renderLogs = (
    logs: AgentLog[], 
    error: string | null, 
    isLoading: boolean, 
    loadFunction: () => void, 
    endRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-900/30 p-4 rounded-lg mb-4">
          <p className="text-red-300">{error}</p>
        </div>
      );
    }
    
    if (logs.length === 0) {
      return <p className="text-gray-400">No logs available</p>;
    }
    
    return (
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={index} className="border-b border-gray-700 pb-3">
            <div className="flex justify-between items-start">
              <span className={`font-bold ${getLevelColor(log.level)}`}>
                {log.level.toUpperCase()}
              </span>
              <span className="text-gray-400 text-sm">
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            <p className="text-white mt-1 whitespace-pre-wrap">{log.message}</p>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-2 bg-[#1a1a4a] p-2 rounded text-xs">
                <pre className="text-gray-300 overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadFunction}
            className="bg-[#1a1a4a] text-yellow-200 px-4 py-2 rounded-lg hover:bg-[#2a2a5a] transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh Logs"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${gluten.className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 text-sm md:text-lg  ${
            activeTab === "chat"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          Chatbot
        </button>
        <button
          className={`px-4 py-2 text-sm md:text-lg  ${
            activeTab === "log"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("log")}
        >
          Agent Log
        </button>
        <button
          className={`px-4 py-2 text-sm md:text-lg ${
            activeTab === "avs"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("avs")}
        >
          AVS Log
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex flex-col h-full">
            {/* Messages */}
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
                        ? "bg-[#2a2a5a] text-white"
                        : "bg-[#4a4a7a] text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-[#4a4a7a] text-white">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions - Show after any assistant message, not just at the beginning */}
            {!isLoading && !isChatEnded && messages.length > 0 && messages[messages.length-1].role === "assistant" && (
              <div className="px-4 pb-3">
                <p className="text-yellow-200 text-sm mb-2">You might want to ask:</p>
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

            {/* Input */}
            <div className="p-3 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex">
                <textarea
                  ref={inputRef}
                  className="flex-1 bg-[#1a1a4a] text-white rounded-l-lg px-3 py-2 outline-none resize-none overflow-hidden"
                  placeholder={isChatEnded ? "Chat has ended" : "Type your message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                  disabled={isChatEnded}
                />
                <button
                  type="submit"
                  className={`${
                    isChatEnded 
                      ? "bg-gray-500 cursor-not-allowed" 
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-black font-bold rounded-r-lg px-3 py-2 transition-colors`}
                  disabled={isLoading || isChatEnded}
                >
                  Send
                </button>
              </form>
              {isChatEnded && (
                <p className="text-yellow-200 text-sm mt-2">
                  This conversation has ended. Start a new chat to continue.
                </p>
              )}
            </div>
          </div>
        ) : activeTab === "log" ? (
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-yellow-200 mb-4">Agent Activity Log</h3>
            {renderLogs(agentLogs, logError, isLoadingLogs, loadAgentLogs, logsEndRef)}
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-yellow-200 mb-4">AVS Log</h3>
            {renderLogs(avsLogs, avsLogError, isLoadingAVSLogs, loadAVSLogs, avsLogsEndRef)}
          </div>
        )}
      </div>
    </div>
  );
}