# Etapa 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias FORZANDO legacy-peer-deps
RUN npm install --legacy-peer-deps

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