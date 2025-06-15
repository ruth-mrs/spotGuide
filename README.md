<img src="https://github.com/user-attachments/assets/813a81d4-5e7d-4020-b971-2d1aaaf48f48" align="right" />

# SpotGuide: Aplicación para explorar puntos de interés
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build and Test](https://github.com/ruth-mrs/spotGuide/actions/workflows/build.yml/badge.svg)](https://github.com/ruth-mrs/spotGuide/actions/workflows/build.yml)

[![Figma](https://img.shields.io/badge/--F24E1E?logo=figma&logoColor=ffffff)](https://www.figma.com/)
[![Ionic](https://img.shields.io/badge/--3880FF?style=flat&logo=ionic&logoColor=white)](https://angular.io/)
[![Angular](https://img.shields.io/badge/--DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![Express](https://img.shields.io/badge/--000000?style=flat&logo=express&logoColor=white)](https://spring.io/)
[![MongoDB](https://img.shields.io/badge/--47A248?style=flat&logo=mongodb&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/--DD2C00?style=flat&logo=firebase&logoColor=white)](https://www.postgresql.org/)
[![Foursquare](https://img.shields.io/badge/--3333FF?style=flat&logo=foursquare&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/--%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

### Tabla de contenidos
**[Descripción](#descripción)**<br>
**[Despliegue del proyecto](#despliegue-del-proyecto)**<br>
**[Herramientas de desarrollo](#herramientas-de-desarrollo)**<br>
**[Instrucciones de configuración](#instrucciones-de-configuración)**<br>
**[License](#license)**<br>

## Descripción
SpotGuide es una aplicación que permite a los usuarios descubrir y explorar puntos de interés en su área.

## Despliegue del proyecto
En contrucción...

## Herramientas de desarrollo
En contrucción...

## Instrucciones de configuración

### Prerrequisitos
- Node.js (v16 o superior)
- MongoDB (instancia local o en la nube)
- npm o yarn

### Configuración del backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```

4. Actualiza el archivo `.env` con tu configuración:
   - Establece tu cadena de conexión de MongoDB
   - Genera un secreto JWT seguro
   - Configura las URL del frontend

5. Inicia MongoDB (si se ejecuta localmente)

6. Ejecuta la aplicación:
   ```bash
   # Modo desarrollo
   npm run dev
   
   # Modo producción
   npm start
   
   # Ejecutar pruebas
   npm test
   ```

### Variables de entorno

- `MONGODB_URI`: Cadena de conexión de MongoDB
- `JWT_SECRET`: Clave secreta para tokens JWT
- `PORT`: Puerto del servidor (por defecto: 3000)
- `NODE_ENV`: Entorno (desarrollo/producción/prueba)
- `FRONTEND_URL_DEV`: URL del frontend en desarrollo
- `FRONTEND_URL_PROD`: URL del frontend en producción

### Endpoints de la API

- `GET /api/health` - Verificación de estado
- `POST /api/auth/*` - Rutas de autenticación
- `GET/POST /api/pois/*` - Rutas de puntos de interés
- `GET /api/users/*` - Rutas de usuarios
- `GET /api/search/*` - Rutas de búsqueda

## License

Copyright (c) 2025 SpotGuide

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
