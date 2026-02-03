FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN HUSKY=0 npm ci

COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV HUSKY=0

COPY package*.json ./
RUN HUSKY=0 npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "dist/src/index.js"]
