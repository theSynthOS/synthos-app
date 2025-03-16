/**
 * Service for interacting with the AI agent
 */

const USERNAME = process.env.NEXT_PUBLIC_USERNAME || '';
const PASSWORD = process.env.NEXT_PUBLIC_PASSWORD || '';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Agent endpoint - use different values based on environment
const AGENT_ENDPOINT = process.env.NEXT_PUBLIC_AI_AGENT || '';


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
export async function sendMessageToAgent(message: string, agentId?: string) {
  console.log(`Sending message to agent: ${isDevelopment ? 'Development mode' : 'Production mode'}`);
  console.log(`Using endpoint: ${AGENT_ENDPOINT}`);
  
  try {
    let data;
    if (isDevelopment) {
      // Development mode - use local format
      const response = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: "user",
          text: message,
        }),
      });

      console.log('Development response:', response);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    
      data = await response.json();
      console.log('Development data received:', data);
      
      // Return the data directly for development mode
      return data;
    } else {
      // Production mode - use production format
      const response = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          agentId: agentId || "0",
        }),
      });

      console.log('Production response:', response);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      data = await response.json();
      console.log('Production data received:', data);
      
      // Check if the response is in the expected format
      if (data && typeof data === 'object') {
        // If the response is an array, convert it to the expected format
        if (Array.isArray(data)) {
          return data.map(item => ({
            user: item.user || 'assistant',
            text: item.text || item.message || item.response || 'No response',
            action: item.action || 'CONTINUE'
          }));
        }
        
        // If the response has a 'response' field, use it
        if (data.response) {
          return [{
            user: 'assistant',
            text: data.response,
            action: data.metadata?.action || 'CONTINUE'
          }];
        }
        
        // If the response has a 'message' field, use it
        if (data.message) {
          return [{
            user: 'assistant',
            text: data.message,
            action: data.action || 'CONTINUE'
          }];
        }
        
        // If the response has a 'text' field, use it
        if (data.text) {
          return [{
            user: data.user || 'assistant',
            text: data.text,
            action: data.action || 'CONTINUE'
          }];
        }
        
        // If we can't determine the format, return the raw data
        return [{
          user: 'assistant',
          text: JSON.stringify(data),
          action: 'CONTINUE'
        }];
      }
      
      // If the response is not an object, return it as a string
      return [{
        user: 'assistant',
        text: String(data),
        action: 'CONTINUE'
      }];
    }
  } catch (error) {
    console.error('Error sending message to agent:', error);
    // Return an error message in the expected format
    return [{
      user: 'assistant',
      text: `Sorry, there was an error: ${error instanceof Error ? error.message : String(error)}`,
      action: 'CONTINUE'
    }];
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
    console.log('Fetching AVS logs from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('AVS logs response status:', response.status);
    
    if (!response.ok) {
      console.error(`Error fetching AVS logs: ${response.status} - ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    console.log('AVS logs data received:', data);
    
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
    console.error('Error fetching AVS logs:', error);
    return [];
  }
}
