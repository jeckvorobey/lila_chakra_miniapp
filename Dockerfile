# --- Build Stage ---
FROM node:22-alpine AS build-stage

WORKDIR /app

# Install dependencies first for better caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build arguments for frontend configuration
ARG VITE_API_URL
ARG VITE_API_PREFIX
ARG VITE_TG_BOT_USERNAME

# Build the app (SPA mode)
RUN yarn build

# --- Production Stage ---
FROM nginx:alpine AS production-stage

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
