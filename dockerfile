FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm i dotenv
Copy . .
ENTRYPOINT cd /usr/src/app && npm start