FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy files
COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 9073

# Start app
CMD ["npm", "run", "dev"]
