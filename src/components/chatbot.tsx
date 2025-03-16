"use client";

import React, { useState, useRef, useEffect } from "react";
import { sendMessageToAgent } from "../services/aiAgent";


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
      
      // Process the response (which is now always an array of items)
      if (Array.isArray(response)) {
        response.forEach((item) => {
          const assistantMessage: Message = {
            role: "assistant",
            content: item.text,
            timestamp: new Date(),
            metadata: {
              user: item.user,
              action: item.action
            }
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
        // Fallback for unexpected response format
        console.error("Unexpected response format:", response);
        const errorMessage: Message = {
          role: "assistant",
          content: "Sorry, I received an unexpected response format. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
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
        // Process the response (which is now always an array of items)
        if (Array.isArray(response)) {
          response.forEach((item) => {
            const assistantMessage: Message = {
              role: "assistant",
              content: item.text,
              timestamp: new Date(),
              metadata: {
                user: item.user,
                action: item.action
              }
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
          // Fallback for unexpected response format
          console.error("Unexpected response format:", response);
          const errorMessage: Message = {
            role: "assistant",
            content: "Sorry, I received an unexpected response format. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
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
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
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
            <form onSubmit={handleSendMessage} className="flex items-center">
              <textarea
                ref={inputRef}
                className="flex-1 bg-[#1a1a4a] text-white rounded-l-lg px-3 py-2 outline-none resize-none overflow-hidden h-10 min-h-[40px] max-h-[80px]"
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
                } text-black font-bold rounded-r-lg px-3 py-2 transition-colors h-10`}
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
      </div>
    );
}