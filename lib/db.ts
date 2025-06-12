import { Message } from "./socket";
import { Pool } from 'pg';

// Add type declaration for pg if missing
declare module 'pg' {
  interface PoolClient {}
}

// Create PostgreSQL connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boys',
  user: 'boys',
  password: 'boys',
});

// Initialize database tables
async function initDb() {
  try {
    // Create chat rooms table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id VARCHAR(50) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        chat_id VARCHAR(50) REFERENCES chat_rooms(id),
        text TEXT NOT NULL,
        sender VARCHAR(100) NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize the database on module load
initDb();

// Function to create a new chat room
export async function createChatRoom(chatId: string): Promise<void> {
  try {
    await pool.query('INSERT INTO chat_rooms (id) VALUES ($1) ON CONFLICT DO NOTHING', [chatId]);
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
}

// Function to get all chat room IDs
export async function getChatRoomIds(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT id FROM chat_rooms');
    return result.rows.map((row: { id: string }) => row.id);
  } catch (error) {
    console.error('Error getting chat room IDs:', error);
    return [];
  }
}

// Function to add a message to a chat room
export async function addMessage(message: Message): Promise<void> {
  try {
    // Make sure the chat room exists
    await createChatRoom(message.chatId);
    
    // Insert the message
    await pool.query(
      'INSERT INTO messages (id, chat_id, text, sender, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [message.id, message.chatId, message.text, message.sender, message.timestamp]
    );
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

// Function to get messages for a chat room
export async function getChatRoomMessages(chatId: string): Promise<Message[]> {
  try {
    const result = await pool.query(
      'SELECT id, chat_id as "chatId", text, sender, timestamp FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chatId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting chat room messages:', error);
    return [];
  }
}

// For backward compatibility, maintain the chatRooms object but it will be empty
// as data is now stored in the database
export const chatRooms: Record<string, Message[]> = {};