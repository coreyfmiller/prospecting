FROM node:20-slim

# Install Playwright system dependencies
RUN npx playwright install-deps chromium

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install
RUN npx playwright install chromium

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/server.js"]
