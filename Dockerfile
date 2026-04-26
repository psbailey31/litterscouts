FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js tsconfig.json postcss.config.js tailwind.config.js ./
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_BASE_URL=/api
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY server/src ./src/
COPY server/tsconfig.json ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/package.json ./
COPY --from=backend /app/prisma ./prisma
COPY --from=frontend /app/dist ./public
RUN mkdir -p uploads && chown -R app:app /app
USER app
EXPOSE 3005
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
