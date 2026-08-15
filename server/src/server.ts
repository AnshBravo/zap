import "./config/dotenv.js";

import app from "./app.js";

import http from "http";
import { initSocket } from "./socket.js";

const PORT = Number(process.env.PORT) || 3000;

// Wrap Express with HTTP Server
const server = http.createServer(app);

//Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`👌✅ Server listening on port: ${PORT}`);
});
