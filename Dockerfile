FROM node:20-alpine
WORKDIR /app
COPY server.cjs ./
COPY dist/ ./dist/
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.cjs"]
