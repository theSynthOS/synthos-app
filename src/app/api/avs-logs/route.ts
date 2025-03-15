import { NextRequest, NextResponse } from 'next/server';

// AVS logs endpoint
const AVS_LOGS_URL = 'https://early-carrots-stare.loca.lt/logs';
const AVS_API_KEY = 'synthos';

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/avs-logs called');
  
  try {
    const response = await fetch(AVS_LOGS_URL, {
      method: 'GET',
      headers: {
        'x-api-key': AVS_API_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] Error fetching AVS logs: ${response.status} - ${response.statusText}`);
      console.error(`[API Route] Error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Error fetching AVS logs: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    // Read the response as text
    const data = await response.text();
    console.log(`[API Route] Successfully fetched AVS logs`);

    // Parse the logs into a structured format
    const logs = parseAVSLogs(data);

    return NextResponse.json({ log: logs });
  } catch (error) {
    console.error('[API Route] Error in AVS logs API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

function parseAVSLogs(logData: string): Array<{
  id: string;
  timestamp: string;
  level: string;
  message: string;
}> {
  if (!logData) return [];
  
  // Split the log data into lines
  const lines = logData.trim().split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    // Try to extract timestamp and message
    // Assuming format might be similar to agent logs
    const match = line.match(/\[(.*?)\]\s+(\w+)\s+(.+)/);
    
    if (match) {
      return {
        id: Math.random().toString(36).substring(2, 15),
        timestamp: match[1],
        level: match[2].toLowerCase(),
        message: match[3],
      };
    }
    
    // If no match, use a default format
    return {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: line,
    };
  });
} 