# Imagen base oficial de Node.js LTS
FROM node:20

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto (por defecto 3000, puedes cambiarlo si usas otro)
EXPOSE 3000

# Comando por defecto para iniciar el backend
CMD ["node", "app.js"]