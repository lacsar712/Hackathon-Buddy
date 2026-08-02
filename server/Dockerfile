FROM docker.m.daocloud.io/library/node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm ci --omit=dev

COPY . .

EXPOSE 8031
CMD ["node", "server.js"]
