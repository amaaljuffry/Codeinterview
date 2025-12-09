// backend/src/index.js - Entry point
import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { setupWebSocket } from "./yjs-server.js";

const server = createServer(app);

// Setup WebSocket for Yjs collaborative editing
setupWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for Yjs connections`);
});
