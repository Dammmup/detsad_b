import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import courseRoutes from './routes/course';
import userRoutes from './routes/user';
import eventRoutes from './routes/event';
import postRoutes from './routes/post';
import lessonRoutes from './routes/lesson';

dotenv.config();

const app = express();
const PORT = 8080;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);

app.get('/', (req, res) => {
  res.send('Uyghur Connect Backend API');
});

mongoose.connect(process.env.MONGO_URI || '', {
  dbName: 'uyghur_connect',
}).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
