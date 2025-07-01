# Stage 1: Build the React application
FROM node:20-slim as build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application data
COPY . .

# Add build argument for the backend URL
ARG VITE_SOCKET_URL

# Set the environment variable for the build process
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application from a lightweight server
FROM nginx:stable-alpine

# Copy the build output from the build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
