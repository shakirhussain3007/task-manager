FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
VOLUME /app/data
CMD ["node", "src/server.js"]
