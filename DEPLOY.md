# Configurações de Deploy

## Variáveis de Ambiente

### Desenvolvimento
```env
VITE_API_URL=http://localhost:5000/api
FLASK_ENV=development
SECRET_KEY=asdf#FGSgvasgf$5$WGT
```

### Produção
```env
VITE_API_URL=https://seu-backend.herokuapp.com/api
FLASK_ENV=production
SECRET_KEY=sua-chave-secreta-super-segura
DATABASE_URL=postgresql://user:pass@host:port/db
```

## Deploy no Heroku

### Backend
1. Criar Procfile:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT src.main:app
```

2. Instalar Gunicorn:
```bash
pip install gunicorn
pip freeze > requirements.txt
```

3. Deploy:
```bash
heroku create seu-app-backend
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Frontend
1. Build:
```bash
pnpm run build
```

2. Deploy no Vercel:
```bash
npx vercel --prod
```

## Deploy no Railway

### Backend
1. Conectar repositório
2. Configurar variáveis de ambiente
3. Deploy automático

### Frontend
1. Build e deploy no Netlify/Vercel
2. Configurar VITE_API_URL para o backend do Railway

## Docker

### Dockerfile Backend
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "src/main.py"]
```

### Dockerfile Frontend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./ordens-marcenaria-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
  
  frontend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

