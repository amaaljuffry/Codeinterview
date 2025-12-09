// backend/src/routes/rooms.js - Room management routes
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../services/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// In-memory room storage for quick access (Yjs syncs the actual content)
const rooms = new Map();

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Interview Session 1
 *               language:
 *                 type: string
 *                 enum: [javascript, python, typescript]
 *                 default: javascript
 *     responses:
 *       200:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roomId:
 *                   type: string
 *                   format: uuid
 *                 url:
 *                   type: string
 *                   example: /room/550e8400-e29b-41d4-a716-446655440000
 *       500:
 *         description: Failed to create room
 */
// POST /api/rooms - Create new room
router.post("/", async (req, res) => {
  try {
    const roomId = uuidv4();
    const { language = "javascript", name } = req.body;

    // Store in memory for quick access
    const roomData = {
      id: roomId,
      name: name || null,
      language,
      createdAt: new Date().toISOString()
    };
    rooms.set(roomId, roomData);

    // Optionally persist to database if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const { verifyToken } = await import("../services/jwt.js");
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        
        if (decoded) {
          await prisma.room.create({
            data: {
              id: roomId,
              name,
              language,
              ownerId: decoded.userId
            }
          });
        }
      } catch (e) {
        // Continue without persisting - user not authenticated
      }
    }

    res.json({ roomId, url: `/room/${roomId}` });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room info by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       500:
 *         description: Failed to get room
 */
// GET /api/rooms/:id - Get room info
router.get("/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    
    // Check in-memory first
    let room = rooms.get(roomId);
    
    if (!room) {
      // Try database
      const dbRoom = await prisma.room.findUnique({
        where: { id: roomId }
      });

      if (dbRoom) {
        room = {
          id: dbRoom.id,
          name: dbRoom.name,
          language: dbRoom.language,
          createdAt: dbRoom.createdAt.toISOString()
        };
        rooms.set(roomId, room);
      } else {
        // Create room on-the-fly if it doesn't exist
        room = {
          id: roomId,
          name: null,
          language: "javascript",
          createdAt: new Date().toISOString()
        };
        rooms.set(roomId, room);
      }
    }

    res.json(room);
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Failed to get room" });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: List user's rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Failed to list rooms
 */
// GET /api/rooms - List all rooms (protected - only user's rooms)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userRooms = await prisma.room.findMany({
      where: { ownerId: req.user.userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(userRooms);
  } catch (error) {
    console.error("List rooms error:", error);
    res.status(500).json({ error: "Failed to list rooms" });
  }
});

// DELETE /api/rooms/:id - Delete room (protected)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    
    // Check ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.room.delete({
      where: { id: roomId }
    });

    rooms.delete(roomId);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// ============ ROOM LIFECYCLE ENDPOINTS ============

/**
 * @swagger
 * /api/rooms/{id}/join:
 *   post:
 *     summary: Join a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const { role = "candidate" } = req.body;
    const participant = await prisma.participant.upsert({
      where: { roomId_userId: { roomId: req.params.id, userId: req.user.userId } },
      update: { leftAt: null, role },
      create: { roomId: req.params.id, userId: req.user.userId, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json({ success: true, participant });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/leave:
 *   post:
 *     summary: Leave a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    await prisma.participant.update({
      where: { roomId_userId: { roomId: req.params.id, userId: req.user.userId } },
      data: { leftAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Leave room error:", error);
    res.status(500).json({ error: "Failed to leave room" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/participants:
 *   get:
 *     summary: List room participants
 *     tags: [Rooms]
 */
router.get("/:id/participants", async (req, res) => {
  try {
    const participants = await prisma.participant.findMany({
      where: { roomId: req.params.id, leftAt: null },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(participants);
  } catch (error) {
    console.error("List participants error:", error);
    res.status(500).json({ error: "Failed to list participants" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/role:
 *   patch:
 *     summary: Update participant role
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id/role", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const participant = await prisma.participant.update({
      where: { roomId_userId: { roomId: req.params.id, userId } },
      data: { role }
    });
    res.json(participant);
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/start:
 *   post:
 *     summary: Start interview session
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/start", authMiddleware, async (req, res) => {
  try {
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { status: "active", startedAt: new Date() }
    });
    res.json({ success: true, room });
  } catch (error) {
    console.error("Start room error:", error);
    res.status(500).json({ error: "Failed to start room" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/end:
 *   post:
 *     summary: End interview session
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/end", authMiddleware, async (req, res) => {
  try {
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { status: "ended", endedAt: new Date() }
    });
    res.json({ success: true, room });
  } catch (error) {
    console.error("End room error:", error);
    res.status(500).json({ error: "Failed to end room" });
  }
});

// ============ EDITOR METADATA ENDPOINTS ============

/**
 * @swagger
 * /api/rooms/{id}/editor/language:
 *   post:
 *     summary: Set editor language
 *     tags: [Rooms]
 */
router.post("/:id/editor/language", async (req, res) => {
  try {
    const { language } = req.body;
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { language }
    });
    res.json({ success: true, language: room.language });
  } catch (error) {
    console.error("Set language error:", error);
    res.status(500).json({ error: "Failed to set language" });
  }
});

/**
 * @swagger
 * /api/rooms/{id}/editor/state:
 *   get:
 *     summary: Get editor state
 *     tags: [Rooms]
 */
router.get("/:id/editor/state", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      select: { id: true, language: true, code: true, status: true }
    });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (error) {
    console.error("Get editor state error:", error);
    res.status(500).json({ error: "Failed to get editor state" });
  }
});

export default router;

