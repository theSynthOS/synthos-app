/**
 * Service for interacting with the AI agent
 */

const AI_AGENT_URL = 'https://autonome.alt.technology/synthos-arimua/ed9ddab6-6713-055c-bca6-3390aee6bf72/message';
const USERNAME = 'synthos';
const PASSWORD = 'mWeImrCabs';

interface AiAgentRequest {
  text: string;
}

interface AiAgentResponse {
  response: string;
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