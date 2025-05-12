const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the Car Match backend!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
