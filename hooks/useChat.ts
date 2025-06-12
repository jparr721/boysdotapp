'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/socket';
import { useRouter } from 'next/navigation';

export function useChat(chatId?: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    // Make sure we're on the client side
    if (typeof window === 'undefined') return;

    const socketInstance = io({
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setIsLoading(false);

      // If we have a chatId, join that chat
      if (currentChatId) {
        socketInstance.emit('join-chat', currentChatId);
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
      setCurrentChatId(id);
      setMessages([]);
      setIsLoading(false);
      router.push(`/chat?id=${id}`, { scroll: false });
    });

    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('chat-history');
      socketInstance.off('new-message');
      socketInstance.off('chat-created');
    };
  }, []);

  // Join a chat room when chatId changes
  useEffect(() => {
    if (socket && currentChatId && isConnected) {
      socket.emit('join-chat', currentChatId);
    }
  }, [currentChatId, isConnected, socket]);

  const sendMessage = (text: string, sender: string) => {
    if (socket && currentChatId && isConnected) {
      socket.emit('send-message', {
        chatId: currentChatId,
        text,
        sender
      });
    }
  };

  return {
    chatId: currentChatId,
    messages,
    sendMessage,
    isConnected,
    isLoading
  };
}
