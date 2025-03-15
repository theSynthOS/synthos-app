import { NextRequest, NextResponse } from 'next/server';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Agent logs API endpoint - use different values based on environment
const AGENT_LOGS_URL = isDevelopment 
  ? 'http://localhost:3000/api/mock-logs' // Local testing URL
  : process.env.NEXT_PUBLIC_AGENT_LOGS_URL;

const AGENT_LOGS_TOKEN = process.env.NEXT_PUBLIC_AGENT_LOGS_TOKEN;

// Default agent ID to use
const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID;

// Validate UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Parse logs
function parseLogString(log: string) {
  if (!log) return [];
  
  const lines = log.trim().split('\n').filter(line => line.trim());
  return lines.map(line => {
    const match = line.match(/\[(.*?)\]\s+(\w+)\s+(.+)/);
    return match
      ? {
          id: Math.random().toString(36).substring(2, 15),
          timestamp: match[1],
          level: match[2],
          message: match[3],
        }
      : {
          id: Math.random().toString(36).substring(2, 15),
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
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
  console.log(`[API Route] Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  
  try {
    // For development, return mock logs
    if (isDevelopment) {
      console.log('[API Route] Using mock logs for development');
      return NextResponse.json({ log: getMockLogs() });
    }
    
    // Use the default agent ID
    const agentId = DEFAULT_AGENT_ID;
    const url = `${AGENT_LOGS_URL}/${agentId}`;
    
    console.log(`[API Route] Fetching logs from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${AGENT_LOGS_TOKEN}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Error fetching logs: ${response.status} - ${response.statusText}`);
      console.error(`[API Route] Error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Error fetching logs: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

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
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
