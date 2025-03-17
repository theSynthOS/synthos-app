import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

// AVS logs API endpoint from environment variables
const AVS_LOGS_URL = process.env.NEXT_PUBLIC_AVS_LOGS_URL || "https://43f6-2001-d08-f0-8b29-908b-5e15-5bdb-5cdb.ngrok-free.app/logs/";
const AVS_LOGS_API_KEY = process.env.NEXT_PUBLIC_AVS_LOGS_API_KEY || "synthos";

console.log("AVS_LOGS_URL:", AVS_LOGS_URL);
console.log("AVS_LOGS_API_KEY:", AVS_LOGS_API_KEY);

// Parse log data from curl output
function parseLogData(data: string) {
  // If the data is empty, return an empty array
  if (!data || data.trim() === '') {
    console.log('[API Route] Empty data received');
    return [];
  }
  
  console.log('[API Route] Raw data length:', data.length);
  
  // Split the data by "data:" prefix which is the SSE format
  const events = data.split(/data:/).filter(event => event.trim());
  console.log('[API Route] Found', events.length, 'events');
  
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
  
  // Process each event
  const parsedEvents = events.map(event => {
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
      // If not JSON, try to extract timestamp and level from the text
      const lines = event.trim().split('\n');
      const parsedLines = lines.map(line => {
        // Try to extract timestamp
        const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        let timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
        
        // Try to extract level
        let level = 'info';
        if (line.includes('error')) level = 'error';
        else if (line.includes('warn')) level = 'warn';
        else if (line.includes('info')) level = 'info';
        else if (line.includes('debug')) level = 'debug';
        
        // Clean up the message
        let message = line;
        if (timestampMatch) {
          message = line.substring(line.indexOf(timestampMatch[1]) + timestampMatch[1].length).trim();
        }
        
        return {
          id: `line-${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          level,
          message
        };
      });
      
      return parsedLines.length === 1 ? parsedLines[0] : {
        id: `text-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: event.trim()
      };
    }
  }).flat().filter(Boolean); // Remove any undefined entries
  
  console.log('[API Route] Parsed', parsedEvents.length, 'events');
  return parsedEvents;
}

// Function to fetch logs using curl
async function fetchLogsWithCurl() {
  console.log('[API Route] Fetching logs with curl');
  
  try {
    // Use curl command with a timeout to get a snapshot of the logs
    // -m 5 sets a 5-second timeout to prevent hanging
    const execPromise = promisify(exec);
    const curlCommand = `curl -s -m 5 -H "x-api-key: ${AVS_LOGS_API_KEY}" ${AVS_LOGS_URL}`;
    console.log('[API Route] Executing curl command:', curlCommand);
    
    const { stdout, stderr } = await execPromise(curlCommand);
    
    console.log('[API Route] Received curl data length:', stdout.length);
    
    // Parse the log data
    const logs = parseLogData(stdout);
    console.log('[API Route] Parsed logs from curl:', logs.length);
    
    return logs;
  } catch (error: any) {
    console.error('[API Route] Error in fetchLogsWithCurl:', error);
    
    // Check if we have stdout data even though there was an error (timeout but with data)
    if (error.stdout && error.stdout.length > 0) {
      console.log('[API Route] Found data in error.stdout, length:', error.stdout.length);
      const logs = parseLogData(error.stdout);
      console.log('[API Route] Parsed logs from error.stdout:', logs.length);
      
      if (logs.length > 0) {
        return logs;
      }
    }
    
    // Return a sample log entry if curl fails
    return [{
      id: 'error-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Error fetching logs: ${error.message || String(error)}`
    }];
  }
}

// Parse the raw SSE data into individual log entries
function parseSSEData(data: string) {
  // Split by data: and filter out empty lines
  const entries = data.split(/data:/).filter(entry => entry.trim());
  
  return entries.map(entry => {
    const lines = entry.trim().split('\n').filter(line => line.trim());
    
    return lines.map(line => {
      // Try to extract timestamp
      const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      let timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      // Try to extract level
      let level = 'info';
      if (line.includes('error')) level = 'error';
      else if (line.includes('warn')) level = 'warn';
      
      return {
        id: `sse-${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        level,
        message: line
      };
    });
  }).flat();
}

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/agent-logs called (fetching AVS logs)');
  
  try {
    // Use curl to get a snapshot of the logs
    const logs = await fetchLogsWithCurl();
    
    if (logs.length === 0) {
      console.log('[API Route] No logs returned, adding a placeholder');
      return NextResponse.json({ 
        log: [{
          id: 'placeholder-' + Math.random().toString(36).substring(2, 6),
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'No logs available at this time. Please check back later.'
        }]
      });
    }
    
    // Return the logs
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
