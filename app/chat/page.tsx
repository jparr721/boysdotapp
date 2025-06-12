'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function ChatPage() {
  const [messageText, setMessageText] = useState('');
  const [username, setUsername] = useState('User');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const urlChatId = searchParams.get('id');

  const {
    chatId,
    messages,
    sendMessage,
    isConnected,
    isLoading
  } = useChat(urlChatId);

  const router = useRouter();

  // Redirect to home if no chat ID is provided
  useEffect(() => {
    if (!urlChatId && !chatId) {
      router.push('/?error=No chat ID provided');
    }
  }, [urlChatId, chatId, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() === '' || !isConnected) return;

    sendMessage(messageText.trim(), username);
    setMessageText('');
  };

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="text-amber-500 flex items-center gap-1 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Connecting...
        </div>
      );
    }

    return (
      <div className="text-green-500 flex items-center gap-1 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Connected
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="h-[calc(100vh-2rem)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <CardTitle>
                {chatId ? `Chat Room: ${chatId}` : 'Creating chat...'}
              </CardTitle>
              {renderConnectionStatus()}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                className="w-32"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 h-[calc(100%-12rem)]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="border-t-transparent border-solid animate-spin rounded-full border-primary border-2 h-6 w-6"></div>
                <p className="text-muted-foreground">Loading chat...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full rounded-md border p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start the conversation!</p>
                  <p className="text-xs mt-2">Share this chat ID with others: <span className="font-mono bg-muted p-1 rounded">{chatId}</span></p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${message.sender === username ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${message.sender === username
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                        }`}
                    >
                      <div className="text-sm font-semibold mb-1">
                        {message.sender}
                      </div>
                      <div className="break-words">{message.text}</div>
                      <div className="text-xs mt-1 opacity-70">
                        {
                          formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
                        }
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              disabled={!chatId || !isConnected || isLoading}
            />
            <Button
              type="submit"
              disabled={!chatId || !isConnected || isLoading}
            >
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
