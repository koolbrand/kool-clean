# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
# Cambiamos el puerto por defecto de nginx a 3080 para que coincida con tu config de Coolify
RUN sed -i 's/listen \(.*\)80;/listen 3080;/g' /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3080
CMD ["nginx", "-g", "daemon off;"]
