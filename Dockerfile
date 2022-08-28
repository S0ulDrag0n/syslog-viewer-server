FROM node:buster-slim

ENV NODE_ENV=production
ENV MYSQL_ROOT_PASSWORD=syslog
ENV MYSQL_HOST=db
ENV MYSQL_DATABASE=syslog
ENV MYSQL_USER=syslog
ENV MYSQL_PASSWORD=syslog

WORKDIR /app
COPY package*.json ./
COPY lib ./lib
COPY pages ./pages
COPY styles ./styles
COPY next.config.js ./
COPY server.js ./
RUN npm install && npm run build
EXPOSE 514
EXPOSE 3000
ENTRYPOINT [ "node", "server.js" ]
