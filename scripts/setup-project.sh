# Start the Docker containers
docker-compose up -d

echo '🟡 - Waiting for MongoDB to be ready...'
# Wait for MongoDB to be ready
./scripts/wait-for-it.sh localhost:27017 -- echo '🟢 - Database is ready!'

# Install project dependencies
npm install

# Start the application server
npm run dev

# Bring down the Docker containers (optional, for cleanup)
# docker-compose down