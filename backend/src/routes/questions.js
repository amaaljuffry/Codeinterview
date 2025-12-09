// backend/src/routes/questions.js - Interview questions routes
import express from "express";
import { prisma } from "../services/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: List all questions
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of questions
 */
router.get("/", async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    const questions = await prisma.question.findMany({
      where: {
        ...(difficulty && { difficulty }),
        ...(category && { category })
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        category: true,
        createdAt: true
      }
    });

    res.json(questions);
  } catch (error) {
    console.error("List questions error:", error);
    res.status(500).json({ error: "Failed to list questions" });
  }
});

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               category:
 *                 type: string
 *               starterCode:
 *                 type: object
 *               testCases:
 *                 type: array
 *     responses:
 *       201:
 *         description: Question created
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, difficulty, category, starterCode, testCases } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const question = await prisma.question.create({
      data: {
        title,
        description,
        difficulty: difficulty || "medium",
        category,
        starterCode,
        testCases,
        authorId: req.user.userId
      }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question details
 */
router.get("/:id", async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ error: "Failed to get question" });
  }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update question
 *     tags: [Questions]
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
 *         description: Updated question
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, difficulty, category, starterCode, testCases } = req.body;

    const question = await prisma.question.findUnique({
      where: { id: req.params.id }
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Only author can update
    if (question.authorId && question.authorId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(difficulty && { difficulty }),
        ...(category !== undefined && { category }),
        ...(starterCode !== undefined && { starterCode }),
        ...(testCases !== undefined && { testCases })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete question
 *     tags: [Questions]
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
 *         description: Question deleted
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id }
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    if (question.authorId && question.authorId !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.question.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

export default router;
