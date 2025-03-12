"use client";

import React, { useState, useRef, useEffect } from "react";
import { Gluten } from "next/font/google";
import { sendMessageToAgent } from "../services/aiAgent";

const gluten = Gluten({
  subsets: ["latin"],
  variable: "--font-gluten",
  weight: ["400", "700"],
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const welcomeMessage: Message = {
        role: "assistant",
        content: `Hello! I'm ${agentName}. How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [agentName]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
      };
      setMessages((prev) => [...prev, assistantMessage]);
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

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${gluten.className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 text-lg ${
            activeTab === "chat"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("chat")}
        >
          Chatbot
        </button>
        <button
          className={`px-4 py-2 text-lg ${
            activeTab === "log"
              ? "bg-[#1a1a4a] text-yellow-200 border-b-2 border-yellow-200"
              : "text-gray-300 hover:bg-[#1a1a4a]"
          }`}
          onClick={() => setActiveTab("log")}
        >
          Agent Log
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

            {/* Input */}
            <div className="p-3 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex">
                <textarea
                  ref={inputRef}
                  className="flex-1 bg-[#1a1a4a] text-white rounded-l-lg px-3 py-2 outline-none resize-none overflow-hidden"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-r-lg px-3 py-2 transition-colors"
                  disabled={isLoading}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-yellow-200 mb-4">Agent Activity Log</h3>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400">No agent activity yet</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="border-b border-gray-700 pb-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-yellow-200">
                        {msg.role === "user" ? "User" : agentName}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {msg.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white mt-1 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
