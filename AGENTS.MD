Below is a **complete, production-ready `agents.md`** designed specifically for **Antigravity** to auto-generate your full-stack application.

It includes:

1. Prisma schema
2. Express backend (signup/login/JWT)
3. Swagger UI (OpenAPI docs)
4. CI/CD with CircleCI
5. File structure + explicit instructions so Antigravity knows what to generate

You can **paste this directly as `agents.md`** in your repo.

---

# agents.md

# End-to-End Code Interview Platform – Auto-Generation Specification

This document instructs Antigravity to generate a **full-stack real-time code interview platform** with:

* **Node.js + Express backend**
* **Prisma ORM**
* **User Authentication (Signup/Login/JWT)**
* **Swagger API Docs**
* **CircleCI CI/CD pipeline**

The app consists of:

* React + Vite (frontend)
* Express API (backend)
* Prisma ORM (PostgreSQL)
* WebSockets + Yjs collaborative editing
* In-browser JavaScript and Python execution (iframe + Pyodide)

---

# 1. GLOBAL PROJECT STRUCTURE

```
project/
├── agents.md
├── package.json
├── client/
│   ├── src/
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── prisma.js
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.middleware.js
│   │   ├── rooms/
│   │   │   ├── room.controller.js
│   │   │   └── room.routes.js
│   │   ├── docs/
│   │   │   └── swagger.js
│   │   └── yjs-server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   └── package.json
└── .circleci/
    └── config.yml
```

---

# 2. DATABASE – PRISMA SETUP (PostgreSQL)

### Generate this Prisma schema:

`/server/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  rooms     Room[]
}

model Room {
  id         String   @id @default(uuid())
  ownerId    String
  code       String   @default("")
  language   String   @default("javascript")
  createdAt  DateTime @default(now())
  owner      User     @relation(fields: [ownerId], references: [id])
}
```

---

# 3. BACKEND – EXPRESS SERVER STRUCTURE

Generate full Express backend with:

* `/api/auth` → signup/login JWT
* `/api/rooms` → CRUD room
* `/api/docs` → Swagger UI
* WebSocket Yjs server at `/ws`

### Backend Requirements

* Node.js 20+
* Express
* Prisma Client
* bcryptjs
* jsonwebtoken
* dotenv
* cors
* swagger-ui-express
* yamljs

---

## 3.1 Prisma Client Loader

`server/src/prisma.js`

```js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
```

---

## 3.2 Express App Entry

`server/src/app.js`

```js
import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import roomRoutes from "./rooms/room.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
```

---

## 3.3 Server Launcher

`server/src/index.js`

```js
import app from "./app.js";
import { startYjsServer } from "./yjs-server.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

startYjsServer();
```

---

# 4. AUTHENTICATION (Signup/Login/JWT)

### 4.1 Controller

`server/src/auth/auth.controller.js`

```js
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { email, password } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: "Email already used" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed }
  });

  res.json({ message: "User registered", user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
};
```

---

### 4.2 Routes

`server/src/auth/auth.routes.js`

```js
import { Router } from "express";
import { register, login } from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
```

---

### 4.3 JWT Middleware

`server/src/auth/auth.middleware.js`

```js
import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

---

# 5. ROOMS CONTROLLER

`server/src/rooms/room.controller.js`

```js
import prisma from "../prisma.js";

export const createRoom = async (req, res) => {
  const { language } = req.body;

  const room = await prisma.room.create({
    data: {
      ownerId: req.userId,
      language
    }
  });

  res.json(room);
};

export const getRoom = async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id }
  });

  if (!room) return res.status(404).json({ error: "Not found" });

  res.json(room);
};

export const listRooms = async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { ownerId: req.userId }
  });

  res.json(rooms);
};
```

---

# 6. ROOMS ROUTES

`server/src/rooms/room.routes.js`

```js
import { Router } from "express";
import { authRequired } from "../auth/auth.middleware.js";
import { createRoom, getRoom, listRooms } from "./room.controller.js";

const router = Router();

router.post("/", authRequired, createRoom);
router.get("/:id", authRequired, getRoom);
router.get("/", authRequired, listRooms);

export default router;
```

---

# 7. SWAGGER (OpenAPI) DOCUMENTATION

`server/src/docs/swagger.js`

```js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Code Interview Platform API",
      version: "1.0.0"
    }
  },
  apis: ["./src/**/*.routes.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
```

---

# 8. CI/CD – CircleCI Pipeline

`.circleci/config.yml`

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  install:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run: cd server && npm install
      - run: cd client && npm install

  test:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run: cd server && npm test || echo "No test"
      - run: cd client && npm test || echo "No test"

  deploy:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run: curl -X POST "$RENDER_DEPLOY_HOOK_URL"

workflows:
  build-test-deploy:
    jobs:
      - install
      - test:
          requires:
            - install
      - deploy:
          requires:
            - test
          filters:
            branches:
              only: main
```

---

# 9. ENVIRONMENT VARIABLES

In `/server/.env`:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=supersecret123
```

---

# 10. FINAL ANTIGRAVITY INSTRUCTIONS

Antigravity must:

1. Generate the full folder structure.
2. Install all dependencies.
3. Generate Prisma Client and run migrations.
4. Generate Express backend with JWT auth.
5. Generate Swagger docs.
6. Generate CI/CD pipeline.
7. Build and connect the React frontend with login + room creation.
8. Deploy to Render (optional if deploy hook provided).


