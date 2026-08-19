# Development stage
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS prod

WORKDIR /app

USER node

COPY --chown=node:node package*.json ./
RUN npm install --omit=dev

COPY --chown=node:node . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["npm", "start"]
