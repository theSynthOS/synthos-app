import { NextRequest } from 'next/server';
import { exec } from 'child_process';

// AVS logs API endpoint from environment variables
const AVS_LOGS_URL = process.env.NEXT_PUBLIC_AVS_LOGS_URL || "https://43f6-2001-d08-f0-8b29-908b-5e15-5bdb-5cdb.ngrok-free.app/logs/";
const AVS_LOGS_API_KEY = process.env.NEXT_PUBLIC_AVS_LOGS_API_KEY || "synthos";

export async function GET(request: NextRequest) {
  console.log('[API Route] GET /api/agent-logs/stream called (streaming AVS logs)');
  
  // Set up SSE response headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      console.log('[API Route] Starting SSE stream');
      
      try {
        // Start curl process to stream logs
        const curlProcess = exec(
          `curl -N -s -H "x-api-key: ${AVS_LOGS_API_KEY}" ${AVS_LOGS_URL}`,
          { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
        );
        
        console.log('[API Route] Curl process started');
        
        // Handle data from curl
        curlProcess.stdout?.on('data', (data) => {
          try {
            const chunk = data.toString();
            console.log('[API Route] Received chunk:', chunk.length, 'bytes');
            // Process the chunk to extract log entries
            const events = chunk.split(/data:/).filter((event: string) => event.trim());
            
            events.forEach((event: string) => {
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
                
                const logEntry = {
                  id: `sse-${Math.random().toString(36).substring(2, 6)}`,
                  timestamp,
                  level,
                  message
                };
                
                // Send the log entry to the client
                const sseData = `data: ${JSON.stringify(logEntry)}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              } catch (e) {
                // If not JSON, send as plain text
                if (event.trim()) {
                  const logEntry = {
                    id: `text-${Math.random().toString(36).substring(2, 6)}`,
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: event.trim()
                  };
                  
                  const sseData = `data: ${JSON.stringify(logEntry)}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                }
              }
            });
            
            // If no events were found but we have data, send it as is
            if (events.length === 0 && chunk.trim()) {
              const logEntry = {
                id: `raw-${Math.random().toString(36).substring(2, 6)}`,
                timestamp: new Date().toISOString(),
                level: 'info',
                message: chunk.trim()
              };
              
              const sseData = `data: ${JSON.stringify(logEntry)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          } catch (error) {
            console.error('[API Route] Error processing chunk:', error);
            
            // Send error as a log entry
            const errorEntry = {
              id: `error-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Error processing log data: ${error instanceof Error ? error.message : String(error)}`
            };
            
            const sseData = `data: ${JSON.stringify(errorEntry)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        });
        
        // Handle errors
        curlProcess.stderr?.on('data', (data) => {
          console.error('[API Route] Curl stderr:', data.toString());
          
          const errorEntry = {
            id: `curl-error-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Curl error: ${data.toString().trim()}`
          };
          
          const sseData = `data: ${JSON.stringify(errorEntry)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        });
        
        // Handle process exit
        curlProcess.on('exit', (code) => {
          console.log('[API Route] Curl process exited with code:', code);
          
          if (code !== 0) {
            const errorEntry = {
              id: `exit-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Curl process exited with code ${code}`
            };
            
            const sseData = `data: ${JSON.stringify(errorEntry)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
          
          // Close the stream
          controller.close();
        });
        
        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('[API Route] Client disconnected, killing curl process');
          curlProcess.kill();
          controller.close();
        });
        
        // Send initial heartbeat
        const heartbeat = {
          id: `heartbeat-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Connected to log stream'
        };
        
        const sseData = `data: ${JSON.stringify(heartbeat)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
        
        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (request.signal.aborted) {
            clearInterval(heartbeatInterval);
            return;
          }
          
          const heartbeat = {
            id: `heartbeat-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Heartbeat'
          };
          
          const sseData = `data: ${JSON.stringify(heartbeat)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        }, 30000);
        
        // Clear interval when client disconnects
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
        });
      } catch (error) {
        console.error('[API Route] Error in SSE stream:', error);
        
        const errorEntry = {
          id: `stream-error-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Error in SSE stream: ${error instanceof Error ? error.message : String(error)}`
        };
        
        const sseData = `data: ${JSON.stringify(errorEntry)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 