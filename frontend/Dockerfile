# Etapa 1: Build
FROM node:18-alpine as build

WORKDIR /app

# 🔥 FORZAR LA VARIABLE DE ENTORNO
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copiar archivos de dependencias
COPY package*.json ./

# Limpiar cache e instalar con fuerza
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps

# INSTALAR AJV EXPLÍCITAMENTE (solución al error)
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Build de la app
RUN npm run build

# Etapa 2: Servir
FROM node:18-alpine

WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve

# Copiar el build desde la etapa anterior
COPY --from=build /app/build ./build

# Exponer puerto
EXPOSE 3000

# Comando para servir la app
CMD ["serve", "-s", "build", "-l", "3000"]