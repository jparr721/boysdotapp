'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/socket';

interface SocketContextType {
  socket: Socket | null;
  chatId: string | null;
  messages: Message[];
  setChatId: (id: string | null) => void;
  createNewChat: () => void;
  joinChat: (id: string) => void;
  sendMessage: (text: string, sender: string) => void;
  isConnected: boolean;
  isLoading: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// This ensures socket instance is shared across components
let socketInstance: Socket | null = null;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    console.log("INITIALIZING SOCKET PROVIDER");
    // Make sure we're on the client side
    if (typeof window === 'undefined') return;

    // First, ensure the socket server is running by calling our API
    const initializeSocket = async () => {
      try {
        // Don't create a new instance if one already exists
        if (!socketInstance) {
          socketInstance = io({
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
          });
        }

        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          setIsLoading(false);

          // If we have a chatId in state, rejoin that chat
          if (chatId) {
            socketInstance?.emit('join-chat', chatId);
          }
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.log('Socket connection error:', error);
          setIsConnected(false);
        });

        socketInstance.on('chat-history', (history: Message[]) => {
          setMessages(history);
          setIsLoading(false);
        });

        socketInstance.on('new-message', (message: Message) => {
          setMessages((prev) => [...prev, message]);
        });

        socketInstance.on('chat-created', (id: string) => {
          setChatId(id);
          setMessages([]);
          setIsLoading(false);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setIsLoading(false);
      }
    };

    initializeSocket();

    // Clean up on unmount - but don't actually disconnect the singleton socket
    return () => {
      if (socketInstance) {
        // Just remove listeners from this component
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('chat-history');
        socketInstance.off('new-message');
        socketInstance.off('chat-created');
      }
    };
  }, []);

  // Join a chat room when chatId changes
  useEffect(() => {
    if (socketInstance && chatId && isConnected) {
      socketInstance.emit('join-chat', chatId);
    }
  }, [chatId, isConnected]);

  const createNewChat = () => {
    if (socketInstance && isConnected) {
      setIsLoading(true);
      socketInstance.emit('create-chat');
    }
  };

  const joinChat = (id: string) => {
    if (id) {
      setIsLoading(true);
      setChatId(id);
    }
  };

  const sendMessage = (text: string, sender: string) => {
    if (socketInstance && chatId && isConnected) {
      socketInstance.emit('send-message', {
        chatId,
        text,
        sender
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        chatId,
        messages,
        setChatId,
        createNewChat,
        joinChat,
        sendMessage,
        isConnected,
        isLoading
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
