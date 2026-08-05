# frontend/Dockerfile

# ---- base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- development ----
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build (used only by production stage) ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- production ----
FROM base AS production
RUN npm ci --omit=dev
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

