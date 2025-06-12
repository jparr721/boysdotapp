"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import io from "socket.io-client";

// Generate a random chat ID
function generateChatId() {
  return Math.random().toString(36).substring(2, 10);
}

interface ChatSelectorProps {
  error: string | null;
  router: ReturnType<typeof useRouter>;
  existingChatRooms: string[];
}

function ChatSelector({ error, router, existingChatRooms }: ChatSelectorProps) {
  return (
    <div className="container mx-auto flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Boys Chat App</CardTitle>
          <CardDescription>
            For the boys
            {error && (
              <div className="text-red-500 mb-4">
                {error}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              className="w-full"
              onClick={() => {
                const newChatId = generateChatId();
                router.push(`/chat?id=${newChatId}`);
              }}
            >
              Start a New Chat
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or join an existing chat
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {existingChatRooms.map((chatId) => (
              <Button
                key={chatId}
                variant="outline"
                onClick={() => router.push(`/chat?id=${chatId}`)}
              >
                {chatId}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <p>No authentication required</p>
          <p>Messages are stored in PostgreSQL</p>
        </CardFooter>
      </Card>

    </div>
  )
}

export default function Home() {
  const router = useRouter();
  const [existingChatRooms, setExistingChatRooms] = useState<string[]>([]);

  // Check if there's an error in the search params
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Fetch chat rooms on page load
  useEffect(() => {
    // Connect to socket server
    const socket = io();
    
    // Fetch existing chat rooms
    socket.emit('fetch-chat-rooms', (rooms: string[]) => {
      setExistingChatRooms(rooms);
      console.log('Fetched chat rooms:', rooms);
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return <ChatSelector error={error} router={router} existingChatRooms={existingChatRooms} />;
}
