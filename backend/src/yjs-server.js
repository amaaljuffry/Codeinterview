// backend/src/yjs-server.js - Yjs WebSocket server
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { encoding, decoding, mutex } from "lib0";

const docs = new Map();

const messageSync = 0;
const messageAwareness = 1;

const getYDoc = (docName) => {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);
  }
  return doc;
};

const send = (conn, message) => {
  if (conn.readyState === 1) {
    conn.send(message);
  }
};

const messageHandler = (conn, doc, message) => {
  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(message);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case messageSync: {
      encoding.writeVarUint(encoder, messageSync);
      const syncMessageType = decoding.readVarUint(decoder);
      
      switch (syncMessageType) {
        case 0: // sync step 1
          encoding.writeVarUint(encoder, 1);
          encoding.writeVarUint8Array(encoder, Y.encodeStateAsUpdate(doc));
          send(conn, encoding.toUint8Array(encoder));
          break;
        case 1: // sync step 2
        case 2: // update
          Y.applyUpdate(doc, decoding.readVarUint8Array(decoder), conn);
          break;
      }
      break;
    }
    case messageAwareness: {
      // Broadcast awareness to all connections
      const awarenessUpdate = decoding.readVarUint8Array(decoder);
      doc.conns?.forEach((_, c) => {
        if (c !== conn) {
          const awarenessEncoder = encoding.createEncoder();
          encoding.writeVarUint(awarenessEncoder, messageAwareness);
          encoding.writeVarUint8Array(awarenessEncoder, awarenessUpdate);
          send(c, encoding.toUint8Array(awarenessEncoder));
        }
      });
      break;
    }
  }
};

export const setupWSConnection = (conn, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docName = url.searchParams.get("room") || "default";
  
  const doc = getYDoc(docName);
  
  if (!doc.conns) {
    doc.conns = new Map();
  }
  doc.conns.set(conn, new Set());

  conn.on("message", (message) => {
    messageHandler(conn, doc, new Uint8Array(message));
  });

  conn.on("close", () => {
    doc.conns?.delete(conn);
  });

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  encoding.writeVarUint(encoder, 0); // sync step 1
  encoding.writeVarUint8Array(encoder, Y.encodeStateVector(doc));
  send(conn, encoding.toUint8Array(encoder));
};

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    console.log("WebSocket connection established");
    setupWSConnection(ws, req);
  });

  return wss;
};
