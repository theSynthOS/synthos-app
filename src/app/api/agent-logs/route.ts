import { NextRequest, NextResponse } from 'next/server';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Agent logs API endpoint - use different values based on environment
const AGENT_LOGS_URL = isDevelopment 
  ? 'http://localhost:3000/api/mock-logs' // Local testing URL
  : process.env.NEXT_PUBLIC_AGENT_LOGS_URL;

const AGENT_LOGS_TOKEN = process.env.NEXT_PUBLIC_AGENT_LOGS_TOKEN;

// Clean the token by removing quotes and extra whitespace
function cleanToken(token: string | undefined): string {
  if (!token) return '';
  // Remove surrounding quotes and trim whitespace
  return token.replace(/^['"](.*)['"]$/, '$1').trim();
}

// Parse logs
function parseLogString(log: string) {
  if (!log) return [];
  
  // First try to parse as JSON
  try {
    const jsonData = JSON.parse(log);
    if (Array.isArray(jsonData)) {
      return jsonData.map((item, index) => ({
        id: `json-${index}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: item.timestamp || new Date().toISOString(),
        level: item.level || 'info',
        message: item.message || JSON.stringify(item),
      }));
    }
  } catch (e) {
    // Not JSON, continue with text parsing
  }
  
  // Handle error stack traces
  if (log.includes('Error:') || log.includes('at ')) {
    // This looks like an error stack trace
    const lines = log.split('\n');
    const errorMessage = lines[0];
    const stackTrace = lines.slice(1).join('\n');
    
    return [{
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: errorMessage,
      metadata: { stackTrace }
    }];
  }
  
  // Handle regular log lines
  const lines = log.trim().split('\n').filter(line => line.trim());
  return lines.map(line => {
    // Try to match timestamp patterns
    const timestampMatch = line.match(/\[(.*?)\]|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const timestamp = timestampMatch ? timestampMatch[0].replace(/[\[\]]/g, '') : new Date().toISOString();
    
    // Try to determine log level
    let level = 'info';
    if (line.toLowerCase().includes('error')) level = 'error';
    else if (line.toLowerCase().includes('warn')) level = 'warn';
    else if (line.toLowerCase().includes('debug')) level = 'debug';
    
    // Clean up the message
    let message = line;
    if (timestampMatch) {
      message = line.substring(timestampMatch[0].length).trim();
    }
    
    return {
      id: Math.random().toString(36).substring(2, 15),
      timestamp,
      level,
      message,
    };
  });
}

// Mock logs for development environment
function getMockLogs() {
  return [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'This is a mock log entry for development',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      level: 'debug',
      message: 'Debug information for local testing',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10000).toISOString(),
      level: 'warn',
      message: 'Warning: This is using mock data',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      level: 'error',
      message: 'Example error log',
      metadata: { details: 'Additional error context' },
    },
  ];
}

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/agent-logs called');
  
  try {
    // If no AGENT_LOGS_URL is set, return empty logs
    if (!AGENT_LOGS_URL) {
      console.log('[API Route] No AGENT_LOGS_URL set, returning empty logs');
      return NextResponse.json({ log: [] });
    }
    
    // Use the URL directly as it already includes the agent ID
    const url = AGENT_LOGS_URL;
    console.log(`[API Route] Fetching logs from: ${url}`);
    
    // Clean and prepare the token
    const token = cleanToken(AGENT_LOGS_TOKEN);
    console.log(`[API Route] Using token: ${token ? '****' + token.substring(token.length - 4) : 'none'}`);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('[API Route] Request headers:', Object.keys(headers));
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    console.log(`[API Route] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Error fetching logs: ${response.status} - ${response.statusText}`);
      console.error(`[API Route] Error details: ${errorText}`);
      
      // Return empty logs array on error
      return NextResponse.json({ log: [] });
    }

    // Only read the response body once
    const data = await response.json();
    console.log(`[API Route] Successfully fetched logs`);

    const logs =
      data.logs?.length ? data.logs :
      data.log ? parseLogString(data.log) :
      Array.isArray(data) ? data :
      typeof data === 'string' ? parseLogString(data) :
      [];

    return NextResponse.json({ log: logs });
  } catch (error) {
    console.error('[API Route] Error in agent logs API route:', error);
    return NextResponse.json({ log: [] });
  }
}
