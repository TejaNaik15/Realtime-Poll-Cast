
import { io } from 'socket.io-client';

const socket = io('https://realtime-poll-cast.onrender.com', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
