FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
COPY frontend/public ./public
EXPOSE 3000
CMD ["node", "src/server.js"]
