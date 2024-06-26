FROM node:latest

WORKDIR /usr/src/app

COPY Conclave-ecommerce/package*.json ./

RUN npm install

COPY Conclave-ecommerce/ ./

EXPOSE 4000

CMD ["node","app.js"]