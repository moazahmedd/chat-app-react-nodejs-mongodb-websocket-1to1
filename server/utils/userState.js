const state = {
  onlineUsers: new Map(),
  chatSocket: null
};

// Add user to online users
const addUser = (userId, socketId) => {
  state.onlineUsers.set(userId, socketId);
  return Array.from(state.onlineUsers.entries());
};

// Remove user from online users
const removeUser = (socketId) => {
  const userEntry = Array.from(state.onlineUsers.entries()).find(([_, sid]) => sid === socketId);
  if (userEntry) {
    state.onlineUsers.delete(userEntry[0]);
    return userEntry[0];
  }
  return null;
};

// Get socket ID for a user
const getUserSocketId = (userId) => {
  return state.onlineUsers.get(userId);
};

// Get all online users
const getAllUsers = () => {
  return Array.from(state.onlineUsers.entries());
};

// Set chat socket
const setChatSocket = (socket) => {
  state.chatSocket = socket;
};

// Get chat socket
const getChatSocket = () => {
  return state.chatSocket;
};

module.exports = {
  addUser,
  removeUser,
  getUserSocketId,
  getAllUsers,
  setChatSocket,
  getChatSocket
};
