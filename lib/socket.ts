// Server-side message structure
import { Message } from "./schemas";

// In-memory store for messages
export const chatMessages: Record<string, Message[]> = {};

// Simple ID generator without crypto dependency
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
