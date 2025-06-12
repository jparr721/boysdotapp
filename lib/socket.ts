// Server-side message structure
export interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  sender: string;
}

// In-memory store for messages
export const chatMessages: Record<string, Message[]> = {};

// Simple ID generator without crypto dependency
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
