import express from 'express';

const app = express();
const PORT = 3002;

app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});