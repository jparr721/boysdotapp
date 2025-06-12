import { z } from 'zod';

// Database row schema for chat rooms - what we get from PostgreSQL
export const DatabaseChatRoomSchema = z.object({
  id: z.string(),
  created_at: z.date().optional()
});

// Database row schema for messages - what we get from PostgreSQL
export const DatabaseMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  text: z.string(),
  sender: z.string(),
  timestamp: z.union([z.string(), z.number()]).transform((val) => Number(val))
});

// Message schema - our application type
export const MessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  text: z.string(),
  sender: z.string(),
  timestamp: z.number()
});

// Chat room schema - our application type
export const ChatRoomSchema = z.object({
  id: z.string(),
  created_at: z.date().optional()
});

export type DatabaseMessage = z.infer<typeof DatabaseMessageSchema>;
export type DatabaseChatRoom = z.infer<typeof DatabaseChatRoomSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ChatRoom = z.infer<typeof ChatRoomSchema>;
