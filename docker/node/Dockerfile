FROM node:20-alpine

WORKDIR /app

# Copier les fichiers package.json depuis le dossier frontend
COPY frontend/package*.json ./

RUN npm install

# Copier tout le code source frontend
COPY frontend/ ./

# Exposer le port Vite
EXPOSE 5173

# Démarrer Vite avec HMR
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]