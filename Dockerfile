# Usa imagem oficial do Node
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copia apenas package.json primeiro (cache de build)
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Expõe porta da aplicação
EXPOSE 3333

# Executa migrações, seeds e build
RUN npx prisma migrate deploy && npx prisma db seed && npm run build

# Comando padrão
CMD ["sh", "-c", "npm run start"]