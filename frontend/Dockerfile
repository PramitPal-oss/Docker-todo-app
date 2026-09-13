# frontend/Dockerfile

# ---- base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- development ----
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---- build (used only by production stage) ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- production (serve build output via Nginx) ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
