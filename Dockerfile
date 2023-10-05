
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production
COPY . .

# Port is set in config.json file, default is 3000
EXPOSE 3000

CMD [ "npm", "start" ]