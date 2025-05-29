const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const { addUser, removeUser, getUserSocketId, getAllUsers, setChatSocket } = require("./utils/userState");
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
    console.log("=== DB Connection Successful ===");
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
  console.log(`=== Server started on ${process.env.PORT} ===`)
);

  // Initialize WebSocket server after HTTP server starts
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

console.log("\n=== WebSocket Server Initialized ===");
console.log("=== Initialized user state management ===");

// Connection handler
io.on("connection", (socket) => {
  console.log("\n=== New Connection ===");
  console.log("New client connected with socket ID:", socket.id);
  
  // Store the socket
  setChatSocket(socket);

  // User join event
  socket.on("add-user", (userId) => {
    console.log("\n=== User Join Event ===");
    console.log("User ID:", userId, "is joining the chat");
    console.log("Socket ID:", socket.id);

    // Add user to online users
    const users = addUser(userId, socket.id);
    console.log("Added user to onlineUsers Map:");
    console.log("Current online users:", users);
  });

  // Message sending event
  socket.on("send-msg", (data) => {
    console.log("\n=== Message Sending Event ===");
    console.log("Message data received:", data);
    
    // Get recipient's socket ID
    const sendUserSocket = getUserSocketId(data.to);
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

  // Remove user event
  socket.on("remove-user", (userId, socketId) => {
    console.log("\n=== Remove User Event ===");
    console.log("User ID:", userId, "is leaving the chat");
    console.log("Socket ID:", socket.id);
    
    // Remove user from online users
    // Not calling remove users function here as its called in logout API.
    console.log("Removed user from onlineUsers Map:");
    const users = getAllUsers();
    console.log("Current online users:", users);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("\n=== Disconnection Event ===");
    console.log("Client disconnected with socket ID:", socket.id);
    
    // Remove user from online users if they exist
    const userId = removeUser(socket.id);
    if (userId) {
      console.log("Removed disconnected user:", userId);
      console.log("Current online users:", getAllUsers());
    }
  });
});

