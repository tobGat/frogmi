import { io } from "socket.io-client";

const socket = io("/", {
  autoConnect: true,
  reconnectionAttempts: Infinity, // keep trying until the server is reachable
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socket;
