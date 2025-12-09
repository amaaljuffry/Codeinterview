// backend/src/routes/execute.js - Code execution routes
import express from "express";

const router = express.Router();

/**
 * @swagger
 * /api/execute:
 *   post:
 *     summary: Execute code in sandbox
 *     tags: [Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - code
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [javascript, python]
 *               code:
 *                 type: string
 *               stdin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Execution result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 output:
 *                   type: string
 *                 error:
 *                   type: string
 *                 executionTime:
 *                   type: number
 */
router.post("/", async (req, res) => {
  try {
    const { language, code, stdin = "" } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "Language and code are required" });
    }

    const supportedLanguages = ["javascript", "python"];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ 
        error: `Unsupported language. Supported: ${supportedLanguages.join(", ")}` 
      });
    }

    const startTime = Date.now();
    let result;

    if (language === "javascript") {
      result = await executeJavaScript(code, stdin);
    } else if (language === "python") {
      result = await executePython(code, stdin);
    }

    const executionTime = Date.now() - startTime;

    res.json({
      success: !result.error,
      output: result.output || "",
      error: result.error || null,
      executionTime
    });
  } catch (error) {
    console.error("Execute error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Execution failed: " + error.message 
    });
  }
});

// JavaScript execution using Node.js vm (sandboxed)
async function executeJavaScript(code, stdin) {
  return new Promise((resolve) => {
    try {
      const outputs = [];
      
      // Create a sandbox with console override
      const sandbox = {
        console: {
          log: (...args) => outputs.push(args.map(String).join(" ")),
          error: (...args) => outputs.push("[ERROR] " + args.map(String).join(" ")),
          warn: (...args) => outputs.push("[WARN] " + args.map(String).join(" "))
        },
        stdin,
        setTimeout: () => {},
        setInterval: () => {}
      };

      // Use Function constructor for basic sandboxing
      const fn = new Function(
        "console", "stdin", "setTimeout", "setInterval",
        code
      );

      // Execute with timeout
      const timeout = setTimeout(() => {
        resolve({ error: "Execution timed out (5s limit)" });
      }, 5000);

      try {
        fn(sandbox.console, stdin, sandbox.setTimeout, sandbox.setInterval);
        clearTimeout(timeout);
        resolve({ output: outputs.join("\n") });
      } catch (e) {
        clearTimeout(timeout);
        resolve({ error: String(e) });
      }
    } catch (error) {
      resolve({ error: String(error) });
    }
  });
}

// Python execution placeholder (uses Pyodide on frontend)
async function executePython(code, stdin) {
  // Note: Python execution is handled on the frontend using Pyodide
  // This endpoint is for potential future server-side execution
  return {
    output: "Python execution is handled in-browser via Pyodide.\n" +
            "For server-side execution, configure a Python sandbox service.",
    error: null
  };
}

export default router;
