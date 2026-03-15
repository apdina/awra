import { NextRequest } from 'next/server';
import { logger } from "@/lib/logger";

// Server-Sent Events endpoint for real-time updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(data));
      
      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(encoder.encode(heartbeatData));
      }, 30000); // 30 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Function to broadcast updates to all connected clients
export async function broadcastUpdate(updateData: any) {
  // This would need to be implemented with a proper pub/sub system
  // like Redis, or a WebSocket server for production use
  logger.log('Broadcasting update:', updateData);
}
