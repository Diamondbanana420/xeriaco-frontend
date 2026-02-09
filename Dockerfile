FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./
COPY dist/ ./dist/
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
