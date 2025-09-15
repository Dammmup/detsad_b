import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { apiLimiter } from './middlewares/rateLimiter';
import dotenv from 'dotenv';
import authRoutes from './routes/authPassword';
import userRoutes from './routes/user';
import eventRoutes from './routes/event';
import fineRoutes from './routes/fine';
import groupRoutes from './routes/group';
import attendanceRoutes from './routes/attendance';
import childAttendanceRoutes from './routes/childAttendance';
import staffShiftRoutes from './routes/staffShift';
import staffAttendanceRoutes from './routes/staffAttendance';
import exportsRoutes from './routes/exports';
import DataCleanupService from './services/dataCleanupService';
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
app.use('/api/child-attendance', childAttendanceRoutes);
app.use('/api/staff-shifts', staffShiftRoutes);
app.use('/api/staff-attendance', staffAttendanceRoutes);
app.use('/api/exports', exportsRoutes);
app.get('/', (req, res) => {
  res.send('Test Backend API');
});

mongoose.connect(process.env.MONGO_URI || '', {
  dbName: 'test',
}).then(() => {
  console.log('MongoDB connected');

  // Initialize data cleanup service
  const dataCleanupService = new DataCleanupService();
  dataCleanupService.startScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(' Excel export system initialized');
    console.log(' Monthly email reports scheduled');
    console.log(' Automatic data cleanup enabled');
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
