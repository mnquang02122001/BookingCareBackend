FROM node:14-alpine

WORKDIR /bookingcare/backend

COPY package*.json ./

RUN npm install

RUN npm install -g @babel/core@7.12.10 @babel/cli@7.12.10

COPY . .

RUN npm run build-src

CMD ["npm", "run", "build"];

# docker build --tag node-docker .
# docker run -p 8080:8080 -d node-docker