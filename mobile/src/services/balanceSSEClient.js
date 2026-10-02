import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

class BalanceSSEClient {
  constructor() {
    this.listeners = new Set();
    this.connection = null;
    this.reconnectTimer = null;
    this.reconnectDelay = 2000;
    this.maxReconnectDelay = 15000;
    this.isConnected = false;
    this.buffer = '';
    this.lastProcessedIndex = 0;
  }

  /**
   * Subscribe a listener callback to balance SSE events.
   * Automatically connects to the stream if not already connected.
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
    this.ensureConnected();

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Ensure SSE connection is active if user is authenticated
   */
  async ensureConnected() {
    if (this.connection) return;

    try {
      const token = useAuthStore.getState().token || (await AsyncStorage.getItem('starpix_user_token'));
      if (!token) {
        // User not logged in, retry later when auth changes
        return;
      }

      this.startConnection(token);
    } catch (err) {
      console.warn('[Balance SSE] Failed to initialize connection:', err.message);
    }
  }

  /**
   * Open the SSE stream using EventSource (Web) or XMLHttpRequest streaming (Native)
   */
  startConnection(token) {
    this.cleanupCurrentConnection();

    const streamUrl = `${API_BASE_URL}/payments/balance-stream?token=${encodeURIComponent(token)}`;

    // 1. Browser / Web environment with EventSource support
    if (typeof EventSource !== 'undefined') {
      try {
        const es = new EventSource(streamUrl);
        this.connection = es;

        es.onopen = () => {
          this.isConnected = true;
          this.reconnectDelay = 2000;
        };

        es.onmessage = (event) => {
          this.handleRawMessage(event.data);
        };

        es.onerror = (err) => {
          console.warn('[Balance SSE] EventSource disconnected, scheduling reconnect...');
          this.isConnected = false;
          this.cleanupCurrentConnection();
          this.scheduleReconnect();
        };
        return;
      } catch (esErr) {
        console.warn('[Balance SSE] EventSource init failed, falling back to XHR stream:', esErr.message);
      }
    }

    // 2. React Native Native streaming via XMLHttpRequest onprogress
    try {
      const xhr = new XMLHttpRequest();
      this.connection = xhr;
      this.lastProcessedIndex = 0;
      this.buffer = '';

      xhr.open('GET', streamUrl, true);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onreadystatechange = () => {
        if (xhr.readyState >= 2) {
          this.isConnected = true;
          this.reconnectDelay = 2000;
        }
      };

      xhr.onprogress = () => {
        try {
          const responseText = xhr.responseText || '';
          if (responseText.length > this.lastProcessedIndex) {
            const newChunk = responseText.substring(this.lastProcessedIndex);
            this.lastProcessedIndex = responseText.length;
            this.parseChunk(newChunk);
          }
        } catch (progErr) {
          // ignore stream read hiccups
        }
      };

      xhr.onloadend = () => {
        this.isConnected = false;
        this.cleanupCurrentConnection();
        if (this.listeners.size > 0) {
          this.scheduleReconnect();
        }
      };

      xhr.onerror = () => {
        this.isConnected = false;
        this.cleanupCurrentConnection();
        if (this.listeners.size > 0) {
          this.scheduleReconnect();
        }
      };

      xhr.send();
    } catch (xhrErr) {
      console.warn('[Balance SSE] XHR stream creation failed:', xhrErr.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Parse incoming chunk for 'data: ...' SSE lines
   */
  parseChunk(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    // Keep whatever is after the last newline in buffer in case it is incomplete
    this.buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('data:')) {
        const jsonStr = line.substring(5).trim();
        if (jsonStr) {
          this.handleRawMessage(jsonStr);
        }
      }
    }
  }

  /**
   * Process parsed JSON payload from SSE
   */
  handleRawMessage(jsonString) {
    try {
      const payload = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!payload) return;

      // Update credit balance in global auth store immediately
      if (payload.credits !== undefined && payload.credits !== null) {
        useAuthStore.getState().setUserCredits(Number(payload.credits));
      }

      // Notify all registered listener components
      this.listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (cbErr) {
          console.warn('[Balance SSE] Error in listener callback:', cbErr);
        }
      });
    } catch (parseErr) {
      // Ignored malformed message
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      if (this.listeners.size > 0) {
        this.ensureConnected();
      }
    }, this.reconnectDelay);
  }

  cleanupCurrentConnection() {
    if (this.connection) {
      try {
        if (typeof this.connection.close === 'function') {
          this.connection.close();
        } else if (typeof this.connection.abort === 'function') {
          this.connection.abort();
        }
      } catch (e) {
        // ignore
      }
      this.connection = null;
    }
    this.buffer = '';
    this.lastProcessedIndex = 0;
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupCurrentConnection();
    this.isConnected = false;
  }
}

export const balanceSSEClient = new BalanceSSEClient();
export default balanceSSEClient;
