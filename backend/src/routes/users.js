// backend/src/routes/users.js - User profile routes
import express from "express";
import { prisma } from "../services/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
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
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        preferences: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *       403:
 *         description: Not authorized
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Users can only update their own profile
    if (req.params.id !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { name, email, profilePicture } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(profilePicture !== undefined && { profilePicture })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        preferences: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * @swagger
 * /api/users/{id}/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *               notifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated preferences
 */
router.patch("/:id/preferences", authMiddleware, async (req, res) => {
  try {
    if (req.params.id !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { preferences: req.body },
      select: { id: true, preferences: true }
    });

    res.json(user);
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
