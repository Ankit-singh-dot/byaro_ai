FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
COPY . .
USER appuser
EXPOSE 4002
CMD ["node", "index.js"]
