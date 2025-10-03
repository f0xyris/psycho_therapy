// WebSocket connection handler - DISABLED
// Vite handles HMR WebSocket connections automatically
// This file is kept for potential future use

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string) {
    // Disabled - let Vite handle HMR
    // Custom WebSocket disabled - Vite handles HMR
  }

  private attemptReconnect(url: string) {
    // Disabled
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }
}

// Create a global WebSocket manager instance
export const wsManager = new WebSocketManager();

// Disable custom WebSocket initialization - let Vite handle it
// if (import.meta.env.DEV) {
//   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//   const host = window.location.hostname;
//   const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
//   
//   // Only connect if we have valid host and port
//   if (host && port && port !== 'undefined') {
//     const wsUrl = `${protocol}//${host}:${port}`;
//     console.log('Initializing WebSocket connection for HMR:', wsUrl);
//     wsManager.connect(wsUrl);
//   } else {
//     console.warn('Cannot initialize WebSocket: invalid host or port', { host, port });
//   }
// } 