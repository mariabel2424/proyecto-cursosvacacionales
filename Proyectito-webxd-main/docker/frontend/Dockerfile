FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

EXPOSE 5173

# Modo desarrollo con hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]