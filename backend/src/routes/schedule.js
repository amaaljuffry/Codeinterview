// backend/src/routes/schedule.js - Interview scheduling routes
import express from "express";
import { prisma } from "../services/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: List scheduled interviews
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of scheduled interviews
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { interviewerId: req.user.userId },
      orderBy: { scheduledAt: "asc" },
      include: {
        room: {
          select: { id: true, name: true, status: true }
        }
      }
    });

    res.json(schedules);
  } catch (error) {
    console.error("List schedules error:", error);
    res.status(500).json({ error: "Failed to list schedules" });
  }
});

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Create a new scheduled interview
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidateEmail
 *               - scheduledAt
 *             properties:
 *               title:
 *                 type: string
 *               candidateEmail:
 *                 type: string
 *                 format: email
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *                 default: 60
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schedule created
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, candidateEmail, scheduledAt, duration, notes, roomId } = req.body;

    if (!candidateEmail || !scheduledAt) {
      return res.status(400).json({ error: "candidateEmail and scheduledAt are required" });
    }

    // Create a room for this interview if not provided
    let interviewRoomId = roomId;
    if (!interviewRoomId) {
      const room = await prisma.room.create({
        data: {
          name: title || `Interview with ${candidateEmail}`,
          ownerId: req.user.userId
        }
      });
      interviewRoomId = room.id;
    }

    const schedule = await prisma.schedule.create({
      data: {
        title,
        candidateEmail,
        interviewerId: req.user.userId,
        roomId: interviewRoomId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        notes
      },
      include: {
        room: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

/**
 * @swagger
 * /api/schedule/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule details
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        room: true,
        interviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ error: "Failed to get schedule" });
  }
});

/**
 * @swagger
 * /api/schedule/{id}:
 *   delete:
 *     summary: Cancel/delete scheduled interview
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule cancelled
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id }
    });

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    if (schedule.interviewerId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.schedule.update({
      where: { id: req.params.id },
      data: { status: "cancelled" }
    });

    res.json({ success: true, status: "cancelled" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ error: "Failed to cancel schedule" });
  }
});

export default router;
