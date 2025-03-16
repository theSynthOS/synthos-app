/**
 * Service for interacting with the AI agent
 */

const AI_AGENT_URL = process.env.NEXT_PUBLIC_AI_AGENT || '';
const USERNAME = process.env.NEXT_PUBLIC_USERNAME || '';
const PASSWORD = process.env.NEXT_PUBLIC_PASSWORD || '';

// Agent logs API endpoint - now using our local API route
const AGENT_LOGS_API_ROUTE = '/api/agent-logs';

interface AiAgentRequest {
  text: string;
}

interface AiAgentResponseItem {
  user: string;
  text: string;
  action: "CONTINUE" | "END" | string;
}

interface AiAgentResponse {
  response: string;
  metadata?: Record<string, any>;
}

interface AgentLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Send a message to the AI agent and get a response
 */
export async function sendMessageToAgent(
  message: string,
  agentId?: string,
  context?: Record<string, any>
): Promise<AiAgentResponse> {
  try {
    // Create Basic Auth header
    const basicAuth = btoa(`${USERNAME}:${PASSWORD}`);
    
    const payload: AiAgentRequest = {
      text: message,
    };

    const response = await fetch(AI_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle array response format
    if (Array.isArray(data)) {
      // Extract the text from the first item in the array
      const firstItem = data[0] as AiAgentResponseItem;
      return {
        response: firstItem.text,
        metadata: { 
          user: firstItem.user, 
          action: firstItem.action 
        },
      };
    }
    
    // Format the response to match our expected interface
    return {
      response: data.text || data.response || JSON.stringify(data),
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error('Error sending message to AI agent:', error);
    throw error;
  }
}

/**
 * Fetch agent logs from the API
 * @returns Array of agent log entries
 */
export async function fetchAgentLogs(): Promise<AgentLogEntry[]> {
  try {
    // Use the local API route
    const url = `/api/agent-logs`;
    console.log('Fetching agent logs from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('Agent logs response status:', response.status);
    
    if (!response.ok) {
      console.error(`Error fetching agent logs: ${response.status} - ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    console.log('Agent logs data received:', data);
    
    // Check if data has the expected structure
    if (data.log && Array.isArray(data.log)) {
      return data.log;
    }
    
    // Fallback for other response formats
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Unexpected data format received from logs API:', data);
    return [];
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return [];
  }
}
