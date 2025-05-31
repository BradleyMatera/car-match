const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import cors
const path = require('path'); // Import path for serving files
const app = express();
const port = 3001;

// It's better to store this in an environment variable
const JWT_SECRET = 'your-secret-key'; 

app.use(cors({
  origin: ['https://4b08-18-212-211-242.ngrok-free.app', 'https://bradleymatera.github.io'],
})); // Enable CORS for multiple origins
app.use(express.json());

// Serve mockApi.js file
app.get('/mockApi.js', (req, res) => {
  const mockApiPath = path.join(__dirname, '../frontend/src/api/mockApi.js');
  res.sendFile(mockApiPath);
});

// Other backend logic remains unchanged...

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
