FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    mkdir -p /data && chown appuser:appgroup /data
COPY . .
USER appuser
EXPOSE 4003
CMD ["node", "index.js"]
