# Use a lightweight Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the application
# For some reason, Railway likes the simple python call best when we have port logic in main.py
CMD ["python", "main.py"]
