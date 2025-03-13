import { NextRequest, NextResponse } from 'next/server';

// Agent logs API endpoint
const AGENT_LOGS_URL = 'https://wizard-bff-rpc.alt.technology/v1/bff/aaa/app/logs';
const AGENT_LOGS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTE5MTAxMjE2Mjk0NzM4MjI3MzQiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1l4ZXBaeHY2Zm5TVnZYT1ZVMV94eG5DdzAyQ0hrbVE0TWJ4YnJLajNzNDBpQWlPcWw9czk2LWMiLCJlbWFpbCI6Inl1ZGhpc2h0aHJhLm1AZ21haWwuY29tIiwibmFtZSI6Ill1ZGhpc2h0aHJhIFN1Z3VtYXJhbiIsIm9yZ19uYW1lIjoiTHVjYTMiLCJvcmdfaWQiOjMzMywicGVybWlzc2lvbnMiOlsid3JpdGU6b3JnX2RlcGxveW1lbnRzIiwid3JpdGU6b3JnX3N1YnNjcmlwdGlvbnMiLCJ3cml0ZTpvcmdfdXNlcnMiXSwiaWF0IjoxNzQxODc5OTIwLCJleHAiOjE3NDE5NjYzMjB9.MFPkp3YvUHQpLVkND_sPuDi6dZpOiecaU6L-AsykYMk';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const agentId = params.agentId;
    console.log(`[API Route] Fetching logs for agent: ${agentId}`);

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
    
    // Return the logs in the same format as the example
    return NextResponse.json({ log: data.logs || data || [] });
  } catch (error) {
    console.error('[API Route] Error in agent logs API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 