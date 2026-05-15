import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
  }

  connect(userId, interviewId) {
    console.log('🔌 Connecting to WebSocket...', { userId, interviewId });
    
    this.socket = io(this.WS_URL, {
      query: {
        userId,
        interviewId
      }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Connected to WebSocket server');
      
      // Join the interview room
      this.emit('join_interview', {
        interviewId,
        userId
      });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('❌ Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event, data) {
    console.log(`📤 Emitting event: ${event}`, data);
    
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.error('WebSocket not connected');
    }
  }

  get connected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();