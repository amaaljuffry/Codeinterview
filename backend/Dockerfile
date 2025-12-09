# Use Node 18 LTS image
FROM node:18-bullseye-slim

WORKDIR /app

# Install deps first (cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001
CMD ["node", "src/index.js"]
