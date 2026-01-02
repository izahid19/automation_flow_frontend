import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const socketUrl = API_BASE_URL.replace('/api', '');
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join rooms based on user role and id
        newSocket.emit('join', {
          userId: user._id || user.id,
          role: user.role,
        });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      // Quote event listeners
      newSocket.on('quote:created', (data) => {
        toast.success(`New quote created: ${data.quote?.quoteNumber || 'Unknown'}`);
      });

      newSocket.on('quote:submitted', (data) => {
        toast.success(`Quote ${data.quote?.quoteNumber || ''} submitted for approval`);
      });

      newSocket.on('quote:approved', (data) => {
        const stage = data.stage === 'se' ? 'Sales Executive' : 'Manager';
        toast.success(`Quote ${data.quote?.quoteNumber || ''} approved by ${stage}`);
      });

      newSocket.on('quote:rejected', (data) => {
        const stage = data.stage === 'se' ? 'Sales Executive' : 'Manager';
        toast.error(`Quote ${data.quote?.quoteNumber || ''} rejected by ${stage}`);
      });

      newSocket.on('quote:design-updated', (data) => {
        toast.success(`Design status updated for ${data.quote?.quoteNumber || ''}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
