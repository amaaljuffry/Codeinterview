// backend/src/services/db.js - Database service with in-memory fallback
import "dotenv/config";
const USE_MEMORY_DB = !process.env.DATABASE_URL;

// In-memory storage
const memoryStore = {
  users: new Map(),
  rooms: new Map(),
  participants: new Map(),
  questions: new Map(),
  schedules: new Map()
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Create mock Prisma-like interface for development without DB
const createMemoryClient = () => ({
  user: {
    findUnique: async ({ where, select }) => {
      const user = [...memoryStore.users.values()].find(u => 
        (where.id && u.id === where.id) || (where.email && u.email === where.email)
      );
      if (!user) return null;
      if (select) {
        return Object.keys(select).reduce((acc, key) => {
          if (select[key]) acc[key] = user[key];
          return acc;
        }, {});
      }
      return user;
    },
    findMany: async ({ where, orderBy } = {}) => {
      let users = [...memoryStore.users.values()];
      if (where) users = users.filter(u => Object.entries(where).every(([k, v]) => u[k] === v));
      return users;
    },
    create: async ({ data }) => {
      const user = { id: generateId(), ...data, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.users.set(user.id, user);
      return user;
    },
    update: async ({ where, data, select }) => {
      const user = await createMemoryClient().user.findUnique({ where });
      if (!user) throw new Error("User not found");
      Object.assign(user, data, { updatedAt: new Date() });
      memoryStore.users.set(user.id, user);
      if (select) {
        return Object.keys(select).reduce((acc, key) => {
          if (select[key]) acc[key] = user[key];
          return acc;
        }, {});
      }
      return user;
    }
  },
  room: {
    findUnique: async ({ where, select, include }) => {
      const room = memoryStore.rooms.get(where.id);
      return room || null;
    },
    findMany: async ({ where, orderBy } = {}) => {
      let rooms = [...memoryStore.rooms.values()];
      if (where?.ownerId) rooms = rooms.filter(r => r.ownerId === where.ownerId);
      return rooms.sort((a, b) => b.createdAt - a.createdAt);
    },
    create: async ({ data }) => {
      const room = { id: generateId(), status: "waiting", ...data, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.rooms.set(room.id, room);
      return room;
    },
    update: async ({ where, data }) => {
      const room = memoryStore.rooms.get(where.id);
      if (!room) throw new Error("Room not found");
      Object.assign(room, data, { updatedAt: new Date() });
      return room;
    },
    delete: async ({ where }) => {
      memoryStore.rooms.delete(where.id);
      return { id: where.id };
    }
  },
  participant: {
    findMany: async ({ where, include }) => {
      let participants = [...memoryStore.participants.values()];
      if (where?.roomId) participants = participants.filter(p => p.roomId === where.roomId);
      if (where?.leftAt === null) participants = participants.filter(p => !p.leftAt);
      // Add user info if needed
      return participants.map(p => ({
        ...p,
        user: memoryStore.users.get(p.userId) || { id: p.userId, name: "Unknown", email: "" }
      }));
    },
    upsert: async ({ where, update, create, include }) => {
      const key = `${where.roomId_userId.roomId}-${where.roomId_userId.userId}`;
      let participant = memoryStore.participants.get(key);
      if (participant) {
        Object.assign(participant, update);
      } else {
        participant = { id: generateId(), ...create, joinedAt: new Date() };
        memoryStore.participants.set(key, participant);
      }
      participant.user = memoryStore.users.get(participant.userId) || { id: participant.userId };
      return participant;
    },
    update: async ({ where, data }) => {
      const key = `${where.roomId_userId.roomId}-${where.roomId_userId.userId}`;
      const participant = memoryStore.participants.get(key);
      if (participant) Object.assign(participant, data);
      return participant;
    }
  },
  question: {
    findUnique: async ({ where, include }) => memoryStore.questions.get(where.id) || null,
    findMany: async ({ where, orderBy, select } = {}) => {
      let questions = [...memoryStore.questions.values()];
      if (where?.difficulty) questions = questions.filter(q => q.difficulty === where.difficulty);
      if (where?.category) questions = questions.filter(q => q.category === where.category);
      return questions.sort((a, b) => b.createdAt - a.createdAt);
    },
    create: async ({ data }) => {
      const question = { id: generateId(), ...data, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.questions.set(question.id, question);
      return question;
    },
    update: async ({ where, data }) => {
      const question = memoryStore.questions.get(where.id);
      if (question) Object.assign(question, data, { updatedAt: new Date() });
      return question;
    },
    delete: async ({ where }) => {
      memoryStore.questions.delete(where.id);
      return { id: where.id };
    }
  },
  schedule: {
    findUnique: async ({ where, include }) => memoryStore.schedules.get(where.id) || null,
    findMany: async ({ where, orderBy, include } = {}) => {
      let schedules = [...memoryStore.schedules.values()];
      if (where?.interviewerId) schedules = schedules.filter(s => s.interviewerId === where.interviewerId);
      return schedules.sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
    create: async ({ data, include }) => {
      const schedule = { id: generateId(), status: "scheduled", ...data, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.schedules.set(schedule.id, schedule);
      if (include?.room && schedule.roomId) {
        schedule.room = memoryStore.rooms.get(schedule.roomId);
      }
      return schedule;
    },
    update: async ({ where, data }) => {
      const schedule = memoryStore.schedules.get(where.id);
      if (schedule) Object.assign(schedule, data, { updatedAt: new Date() });
      return schedule;
    }
  },
  $connect: async () => console.log("📦 Using in-memory database (no PostgreSQL)"),
  $disconnect: async () => {}
});

// Export prisma client (real or mock)
let prisma;

if (USE_MEMORY_DB) {
  console.log("⚠️  DATABASE_URL not found - using in-memory storage (data will be lost on restart)");
  prisma = createMemoryClient();
} else {
  const { PrismaClient } = await import("@prisma/client");
  const globalForPrisma = globalThis;
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };
export async function disconnect() { await prisma.$disconnect(); }
export async function connect() { await prisma.$connect(); }

