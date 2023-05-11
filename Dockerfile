FROM node:16.14.2

ENV NODE_ENV=dev

COPY . .

RUN ["/bin/bash", "-c", "npm install --save-dev"]

CMD [ "node", "server.js" ]