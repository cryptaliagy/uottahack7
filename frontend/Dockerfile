FROM node:23-alpine AS dev

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app/

CMD ["npm", "run", "dev"]

FROM dev AS runner

RUN npm run build

CMD ["npm", "run", "start"]

