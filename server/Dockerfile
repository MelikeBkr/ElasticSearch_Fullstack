# Use Node v8.9.0 LTS
FROM node:carbon

# Setup app working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# test melike
RUN yarn global add @vue/cli -g

# Copy sourcecode
COPY . .

# Start app
CMD [ "npm", "start" ]