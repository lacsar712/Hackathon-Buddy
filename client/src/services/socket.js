import { io } from 'socket.io-client';

// Connect to the backend socket server (undefined => current page origin)
const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
  autoConnect: false, // connect manually when needed
});

export default socket;
