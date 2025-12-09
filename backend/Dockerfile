# Use full Node 18 image to ensure all network/SSL libraries are present
FROM node:18

# Install system dependencies (OpenSSL, certificates) to ensure DB connection works
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies: use npm ci if lock file exists, else npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose backend port
EXPOSE 3001

# Start the server
CMD ["node", "src/index.js"]
