# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the working directory
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["npm", "run", "dev"]
