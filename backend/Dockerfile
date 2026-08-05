# backend/Dockerfile

# ---- base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- development ----
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- build ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- production ----
FROM base AS production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 5000
CMD ["npm", "run", "start"]
