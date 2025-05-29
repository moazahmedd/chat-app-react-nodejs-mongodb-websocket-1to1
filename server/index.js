const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

console.log("\n=== WebSocket Server Initialization ===");
console.log("Starting Socket.io server with CORS configuration:");
console.log("Allowed origin:", "http://localhost:3000");
console.log("Credentials enabled:", true);

// Create a Map to track online users
global.onlineUsers = new Map();
console.log("\n=== Online Users Tracking ===");
console.log("Initialized onlineUsers Map to track connected users");

// Reference to the Map
const onlineUsers = global.onlineUsers;

// Connection handler
io.on("connection", (socket) => {
  console.log("\n=== New Connection ===");
  console.log("New client connected with socket ID:", socket.id);
  
  // Store the socket globally
  global.chatSocket = socket;
  console.log("Global chatSocket set to:", socket.id);

  // User join event
  socket.on("add-user", (userId) => {
    console.log("\n=== User Join Event ===");
    console.log("User ID:", userId, "is joining the chat");
    console.log("Socket ID:", socket.id);

    // Add user to online users map
    onlineUsers.set(userId, socket.id);
    console.log("Added user to onlineUsers Map:");
    console.log("Current online users:", Array.from(onlineUsers.entries()));
  });

  // Message sending event
  socket.on("send-msg", (data) => {
    console.log("\n=== Message Sending Event ===");
    console.log("Message data received:", data);
    
    // Get recipient's socket ID
    const sendUserSocket = onlineUsers.get(data.to);
    console.log("Looking for recipient with ID:", data.to);
    console.log("Found recipient socket ID:", sendUserSocket);

    if (sendUserSocket) {
      console.log("Sending message to recipient");
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
      console.log("Message sent successfully to recipient");
    } else {
      console.log("Warning: Recipient not found in online users");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("\n=== Disconnection Event ===");
    console.log("Client disconnected with socket ID:", socket.id);
    
    // Remove user from online users if they exist
    const disconnectedUser = Array.from(onlineUsers.entries()).find(([_, socketId]) => socketId === socket.id);
    if (disconnectedUser) {
      onlineUsers.delete(disconnectedUser[0]);
      console.log("Removed disconnected user from online users");
      console.log("Current online users:", Array.from(onlineUsers.entries()));
    }
  });
});
