"use client";

import React, { useState, useRef, useEffect } from "react";
import { Gluten } from "next/font/google";
import { sendMessageToAgent, fetchAgentLogs } from "../services/aiAgent";

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
  const [activeTab, setActiveTab] = useState<"chat" | "log">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

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
  }, [agentName]);

  // Fetch agent logs when the log tab is activated
  useEffect(() => {
    if (activeTab === "log" && agentLogs.length === 0) {
      loadAgentLogs();
    }
  }, [activeTab]);

  const loadAgentLogs = async () => {
    setIsLoadingLogs(true);
    setLogError(null);
    
    try {
      // Use a valid UUID format for the agent ID
      // The error shows that "2" is not a valid UUID format
      const validAgentId = "d7d9277b-850a-44a1-84e1-8506e9488f33";
      console.log('Loading agent logs for ID:', validAgentId);
      
      const logs = await fetchAgentLogs(validAgentId);
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
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        metadata: response.metadata,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
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
         {/* <button
          className={`px-4 py-2 text-sm md:text-lg ${
            activeTab === "log"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("log")}
        >
          AVS Log
        </button> */}
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
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-yellow-200 mb-4">Agent Activity Log</h3>
            
            {isLoadingLogs ? (
              <div className="flex justify-center items-center h-32">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-200 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            ) : logError ? (
              <div className="bg-red-900/30 p-4 rounded-lg mb-4">
                <p className="text-red-300">{logError}</p>
              </div>
            ) : agentLogs.length === 0 ? (
              <p className="text-gray-400">No agent logs available</p>
            ) : (
              <div className="space-y-4">
                {agentLogs.map((log, index) => (
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
                <div ref={logsEndRef} />
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadAgentLogs}
                className="bg-[#1a1a4a] text-yellow-200 px-4 py-2 rounded-lg hover:bg-[#2a2a5a] transition-colors"
                disabled={isLoadingLogs}
              >
                {isLoadingLogs ? "Loading..." : "Refresh Logs"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
