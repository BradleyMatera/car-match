const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const app = express();
const port = 3001;

// It's better to store this in an environment variable
const JWT_SECRET = 'your-secret-key'; 

app.use(cors({
  origin: ['https://4b08-18-212-211-242.ngrok-free.app', 'https://bradleymatera.github.io'],
})); // Enable CORS for multiple origins
app.use(express.json());

// In-memory store for users
const users = []; 
const saltRounds = 10;

// Other backend logic remains unchanged...

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
