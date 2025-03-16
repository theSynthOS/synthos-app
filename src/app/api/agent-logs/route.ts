import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

// AVS logs API endpoint
const AVS_LOGS_URL = "https://43f6-2001-d08-f0-8b29-908b-5e15-5bdb-5cdb.ngrok-free.app/logs/";
const AVS_LOGS_API_KEY = "synthos";

// Parse log data from curl output
function parseLogData(data: string) {
  // Split the data by "data:" prefix which is the SSE format
  const events = data.split(/data:/).filter(event => event.trim());
  
  if (events.length === 0) {
    // If no events found, try to parse the whole data
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(data.trim());
      return [{
        id: `json-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: jsonData.time || jsonData.timestamp || new Date().toISOString(),
        level: jsonData.level?.toLowerCase() || 'info',
        message: jsonData.msg || jsonData.message || JSON.stringify(jsonData)
      }];
    } catch (e) {
      // If not JSON, return as plain text
      return [{
        id: `text-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: data.trim()
      }];
    }
  }
  
  return events.map(event => {
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(event.trim());
      
      // Extract timestamp and level from the data
      let timestamp = new Date().toISOString();
      let level = 'info';
      let message = '';
      
      if (jsonData.time) {
        timestamp = jsonData.time;
      } else if (jsonData.timestamp) {
        timestamp = jsonData.timestamp;
      }
      
      if (jsonData.level) {
        level = jsonData.level.toLowerCase();
      }
      
      if (jsonData.msg) {
        message = jsonData.msg;
      } else if (jsonData.message) {
        message = jsonData.message;
      } else {
        message = JSON.stringify(jsonData);
      }
      
      return {
        id: `sse-${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        level,
        message
      };
    } catch (e) {
      // If not JSON, return as plain text
      return {
        id: `sse-text-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: event.trim()
      };
    }
  });
}

// Function to fetch logs using node-fetch
async function fetchLogsWithFetch() {
  console.log('[API Route] Fetching logs with fetch');
  
  try {
    const response = await fetch(AVS_LOGS_URL, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'x-api-key': AVS_LOGS_API_KEY
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching AVS logs: ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('[API Route] Received data length:', text.length);
    
    // Parse the log data
    const logs = parseLogData(text);
    console.log('[API Route] Parsed logs:', logs.length);
    
    return logs;
  } catch (error: any) {
    console.error('[API Route] Error in fetchLogsWithFetch:', error);
    
    // Try using curl as a fallback
    return fetchLogsWithCurl();
  }
}

// Function to fetch logs using curl (as a fallback)
async function fetchLogsWithCurl() {
  console.log('[API Route] Fetching logs with curl fallback');
  
  try {
    // Use curl command that we know works
    const execPromise = promisify(exec);
    const { stdout } = await execPromise(`curl -s -N -H "x-api-key: ${AVS_LOGS_API_KEY}" ${AVS_LOGS_URL}`);
    
    console.log('[API Route] Received curl data length:', stdout.length);
    
    // Parse the log data
    const logs = parseLogData(stdout);
    console.log('[API Route] Parsed logs from curl:', logs.length);
    
    return logs;
  } catch (error) {
    console.error('[API Route] Error in fetchLogsWithCurl:', error);
    
    // Return a sample log entry if both methods fail
    return [{
      id: 'error-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`
    }];
  }
}

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/agent-logs called (fetching AVS logs)');
  
  try {
    // Try fetch first, then fall back to curl if needed
    const logs = await fetchLogsWithFetch();
    
    return NextResponse.json({ log: logs });
  } catch (error) {
    console.error('[API Route] Error in AVS logs API route:', error);
    return NextResponse.json({ 
      log: [{
        id: 'error-' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`
      }] 
    });
  }
}
