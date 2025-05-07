# Base image
FROM ubuntu:22.04

# Avoid interactive prompt during installs
ARG DEBIAN_FRONTEND=noninteractive

# Update and install Node.js and npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
