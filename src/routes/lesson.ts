import express from 'express';
import Lesson from '../models/Lesson';
import Course from '../models/Course';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Создать новый урок (admin, teacher)
router.post('/', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    console.log('[Backend] Creating lesson with data:', req.body);
    console.log('[Backend] Looking for course with ID:', req.body.course);
    
    // Проверяем, что ID курса имеет правильный формат
    if (!req.body.course || typeof req.body.course !== 'string' || req.body.course.length !== 24) {
      console.error('[Backend] Invalid course ID format:', req.body.course);
      return res.status(400).json({ error: 'Invalid course ID format' });
    }
    
    // Проверяем, существует ли курс
    console.log('[Backend] Looking up course by ID:', req.body.course);
    console.log('[Backend] Course ID type:', typeof req.body.course);
    
    // Дебаг: проверка всех доступных курсов
    const allCourses = await Course.find().limit(5);
    console.log('[Backend] Available courses:');
    // Исправляем ошибку типизации: '_id is of type unknown'
    allCourses.forEach(course => {
      // Явно приводим типы MongoDB ObjectId для корректного отображения
      const courseId = course._id ? course._id.toString() : 'unknown';
      console.log(`- Course: ${course.name}, ID: ${courseId}`);
    });
    
    const course = await Course.findById(req.body.course);
    console.log('[Backend] Course found:', !!course);
    
    if (!course) {
      console.error('[Backend] Course not found with ID:', req.body.course);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Проверяем, имеет ли пользователь права на добавление урока к этому курсу
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Получаем максимальный порядковый номер уроков для этого курса
    const maxOrderLesson = await Lesson.findOne({ course: req.body.course })
      .sort({ order: -1 });
    
    const newOrder = maxOrderLesson ? maxOrderLesson.order + 1 : 1;
    
    const lesson = new Lesson({
      ...req.body,
      order: req.body.order || newOrder,
    });
    
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Получить все уроки для курса (public)
router.get('/course/:courseId', async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Получить конкретный урок (public)
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Обновить урок (admin, teacher)
router.put('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Проверяем курс для этого урока
    const course = await Course.findById(lesson.course);
    if (!course) {
      return res.status(404).json({ error: 'Associated course not found' });
    }
    
    // Только admin или владелец курса может редактировать уроки
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Обновляем поля урока
    Object.assign(lesson, req.body);
    await lesson.save();
    
    res.json(lesson);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Удалить урок (admin, teacher)
router.delete('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Проверяем курс для этого урока
    const course = await Course.findById(lesson.course);
    if (!course) {
      return res.status(404).json({ error: 'Associated course not found' });
    }
    
    // Только admin или владелец курса может удалять уроки
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

export default router;
