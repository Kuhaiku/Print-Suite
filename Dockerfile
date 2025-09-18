# Usa uma imagem oficial do Node.js como base
FROM node:18-alpine

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependência e instala-as
# Isso otimiza o cache do Docker, já que as dependências raramente mudam
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos da aplicação
COPY . .

# Expõe a porta em que o aplicativo vai rodar (a mesma do seu server.js)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]