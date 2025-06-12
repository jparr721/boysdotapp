import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { Message } from "@/lib/socket";
import { createChatRoom, getChatRoomMessages, addMessage, getChatRoomIds } from "@/lib/db";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("new connection", socket.id);

        // Handle creating a new chat room
        socket.on("create-chat", async () => {
            const chatId = Math.random().toString(36).substring(2, 10);
            await createChatRoom(chatId);
            socket.join(chatId);
            socket.emit("chat-created", chatId);
            console.log(`Chat room created: ${chatId}`);
        });

        // Handle joining an existing chat room
        socket.on("join-chat", async (chatId: string) => {
            await createChatRoom(chatId); // This will create if not exists
            socket.join(chatId);
            
            // Get messages from database
            const messages = await getChatRoomMessages(chatId);
            socket.emit("chat-history", messages);
            console.log(`User joined chat: ${chatId}`);
        });

        // Handle sending messages
        socket.on("send-message", async (data: { chatId: string; text: string; sender: string }) => {
            const message: Message = {
                id: Date.now().toString(),
                chatId: data.chatId,
                text: data.text,
                sender: data.sender,
                timestamp: Date.now()
            };

            // Save message to database
            await addMessage(message);
            
            // Broadcast to all clients in the room
            io.to(data.chatId).emit("new-message", message);
            console.log(`Message sent in ${data.chatId}: ${data.text}`);
        });

        socket.on("fetch-chat-rooms", async (callback) => {
            const rooms = await getChatRoomIds();
            callback(rooms);
        })

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("user disconnected", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});