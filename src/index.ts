import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { apiLimiter } from './middlewares/rateLimiter';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import eventRoutes from './routes/event';
import fineRoutes from './routes/fine';
import groupRoutes from './routes/group';
import attendanceRoutes from './routes/attendance';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
// Global rate limiter
app.use(apiLimiter);
app.use(express.urlencoded({ limit: "10mb", extended: true }));





app.use('/api/auth', authRoutes);

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.get('/', (req, res) => {
  res.send('Test Backend API');
});

mongoose.connect(process.env.MONGO_URI || '', {
  dbName: 'test',
}).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
