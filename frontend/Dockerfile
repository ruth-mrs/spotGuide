FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

# Instalar dependencias (esto instala esbuild para Linux)
RUN npm install

# Copiar el resto del código fuente (NO node_modules)
COPY . .

# Construir la app Angular/Ionic
RUN npm run build

# Instalar servidor estático para producción
RUN npm install -g http-server

EXPOSE 8080

# Cambia "www" por "dist" si tu build genera "dist"
CMD ["http-server", "www", "-p", "8080", "-c-1"]