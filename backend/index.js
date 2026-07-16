const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'AI Diet & Fitness System API is running!' });
});

// Routes
const authRoutes = require('./routes/auth');
const weightRoutes = require('./routes/weight');
const planRoutes = require('./routes/plan');
const recommendRoutes = require('./routes/recommend');

app.use('/api/auth', authRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});