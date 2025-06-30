FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy all files
COPY . .

# Build TypeScript
RUN npm run build:tsc

# Copy public files to dist (force rebuild)
RUN echo "Cache bust: $(date)" && cp -r public dist/

# Expose port
EXPOSE 8080

# Start server directly
CMD ["node", "dist/app.simple.js"]