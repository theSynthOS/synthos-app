import { NextRequest, NextResponse } from 'next/server';

// Agent logs API endpoint
const AGENT_LOGS_URL = 'https://wizard-bff-rpc.alt.technology/v1/bff/aaa/app/logs';
const AGENT_LOGS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTE5MTAxMjE2Mjk0NzM4MjI3MzQiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1l4ZXBaeHY2Zm5TVnZYT1ZVMV94eG5DdzAyQ0hrbVE0TWJ4YnJLajNzNDBpQWlPcWw9czk2LWMiLCJlbWFpbCI6Inl1ZGhpc2h0aHJhLm1AZ21haWwuY29tIiwibmFtZSI6Ill1ZGhpc2h0aHJhIFN1Z3VtYXJhbiIsIm9yZ19uYW1lIjoiTHVjYTMiLCJvcmdfaWQiOjMzMywicGVybWlzc2lvbnMiOlsid3JpdGU6b3JnX2RlcGxveW1lbnRzIiwid3JpdGU6b3JnX3N1YnNjcmlwdGlvbnMiLCJ3cml0ZTpvcmdfdXNlcnMiXSwiaWF0IjoxNzQxODc5OTIwLCJleHAiOjE3NDE5NjYzMjB9.MFPkp3YvUHQpLVkND_sPuDi6dZpOiecaU6L-AsykYMk';

// Function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Function to parse log string into structured log objects
function parseLogString(logString: string): any[] {
  if (!logString) return [];
  
  // Clean up the string and split into lines
  const lines = logString
    .replace(/\\n/g, '\n')
    .split('\n')
    .filter(line => line.trim().length > 0);
  
  return lines.map(line => {
    // Try to extract timestamp, level, and message using regex
    const match = line.match(/\[(.*?)\]\s+(\w+)\s+(.+)/);
    if (match) {
      return {
        id: Math.random().toString(36).substring(2, 15),
        timestamp: match[1],
        level: match[2].toLowerCase(),
        message: match[3],
      };
    }
    
    // Fallback if regex doesn't match
    return {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: line,
    };
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const agentId = params.agentId;
    console.log(`[API Route] Fetching logs for agent: ${agentId}`);

    // Validate UUID format
    if (!isValidUUID(agentId)) {
      console.error(`[API Route] Invalid UUID format: ${agentId}`);
      return NextResponse.json(
        { 
          error: 'Invalid UUID format', 
          details: 'The agent ID must be a valid UUID in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' 
        },
        { status: 400 }
      );
    }

    const url = `${AGENT_LOGS_URL}/${agentId}`;
    
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
      console.error(`[API Route] Error fetching logs: ${response.status} - ${response.statusText}`);
      
      // Try to get error details from response
      const errorText = await response.text();
      console.error('[API Route] Error details:', errorText);
      
      return NextResponse.json(
        { error: `Failed to fetch logs: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] Successfully fetched logs for agent: ${agentId}`);
    
    // Handle different response formats
    if (data.logs && Array.isArray(data.logs)) {
      return NextResponse.json({ log: data.logs });
    } else if (Array.isArray(data)) {
      return NextResponse.json({ log: data });
    } else if (typeof data === 'string') {
      // Parse log string into structured format
      const parsedLogs = parseLogString(data);
      return NextResponse.json({ log: parsedLogs });
    } else if (data.log && typeof data.log === 'string') {
      // Parse log string into structured format
      const parsedLogs = parseLogString(data.log);
      return NextResponse.json({ log: parsedLogs });
    }
    
    // Return empty array if no recognizable format
    return NextResponse.json({ log: [] });
  } catch (error) {
    console.error('[API Route] Error in agent logs API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 