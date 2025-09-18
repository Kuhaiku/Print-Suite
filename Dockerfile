# Usa uma imagem oficial do Node.js como base
FROM node:18-alpine

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependência (package.json e package-lock.json)
# Isso permite que o Docker otimize o cache para esta etapa
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install express

# Copia o restante dos arquivos da sua aplicação
COPY . .

# Expõe a porta em que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]