# Build stage (optional if you want to build inside docker, but here we assume dist exists or we build it)
# We will do a multi-stage build to ensure we have the artifacts

FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Python Server Stage
FROM python:3.11-slim
WORKDIR /app

# Install Flask
RUN pip install flask

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.py .

# Expose port
ENV PORT=8080
EXPOSE 8080

# Run the python server
CMD ["python", "server.py"]
