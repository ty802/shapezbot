FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
Copy . .
ENTRYPOINT cd /usr/src/app && npm start