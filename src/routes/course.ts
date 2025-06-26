import express from 'express';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import mongoose from 'mongoose';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Add new course (admin, teacher)
router.post('/', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  const session = await Course.startSession();
  session.startTransaction();
  try {
    const courseId = new Course()._id; // генерируем ObjectId для курса заранее

    // 1. Создаём минимальный урок-заглушку
    const lesson = await Lesson.create([{
      title: 'Placeholder',
      content: 'Placeholder',
      course: courseId,
      order: 0,
    }], { session });

    // 2. Создаём сам курс, указывая lessonId
    const course = new Course({
      ...req.body,
      _id: courseId,
      lessonId: lesson[0]._id,
      createdBy: req.user.id,
    });
    await course.save({ session });

    await session.commitTransaction();
    res.status(201).json(course);
  } catch (err) {
    await session.abortTransaction();
    const error = err as Error;
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Delete course (admin, teacher)
router.delete('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    // Только admin или владелец может удалить
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Edit course (admin, teacher)
router.put('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    // Только admin или владелец может редактировать
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    Object.assign(course, req.body);
    await course.save();
    res.json(course);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get course by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

export default router;
