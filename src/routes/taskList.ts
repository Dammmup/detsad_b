import express from 'express';
import TaskList from '../models/TaskList';
import User from '../models/Users';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Получить список задач с фильтрацией
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    console.log('📋 Запрос на получение списка задач', req.query);
    console.log('👤 Пользователь:', req.user.fullName, 'Роль:', req.user.role);

    const { 
      assignedTo, 
      createdBy, 
      completed, 
      priority, 
      category, 
      dueDate,
      search
    } = req.query;

    // Фильтр по умолчанию - задачи, назначенные текущему пользователю
    let filter: any = { assignedTo: req.user.id };

    // Ролевая фильтрация
    if (req.user.role === 'admin') {
      // Администратор видит все задачи
      filter = {};
      if (assignedTo) filter.assignedTo = assignedTo;
      if (createdBy) filter.createdBy = createdBy;
    } else if (req.user.role === 'teacher' || req.user.role === 'assistant') {
      // Учителя и ассистенты видят задачи, назначенные им или созданные ими
      filter.$or = [
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
      ];
    } else {
      // Другие роли видят только задачи, назначенные им
      filter.assignedTo = req.user.id;
    }

    // Применение других фильтров
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    if (priority) {
      filter.priority = priority;
    }
    if (category) {
      filter.category = category;
    }
    if (dueDate) {
      filter.dueDate = new Date(dueDate as string);
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    console.log('🔍 Примененный фильтр:', filter);

    const tasks = await TaskList.find(filter)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    console.log(`✅ Найдено ${tasks.length} задач`);

    res.json(tasks);
  } catch (err) {
    console.error('❌ Ошибка получения списка задач:', err);
    res.status(500).json({ error: 'Ошибка получения списка задач' });
  }
});

// Создать новую задачу
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    console.log('➕ Создание новой задачи:', req.body);
    console.log('👤 Создатель:', req.user.fullName);

    const { 
      title, 
      description, 
      assignedTo, 
      dueDate, 
      priority, 
      category 
    } = req.body;

    // Проверка обязательных полей
    if (!title) {
      return res.status(400).json({ error: 'Название задачи обязательно' });
    }

    // Проверка, что пользователь, которому назначается задача, существует
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(400).json({ error: 'Пользователь для назначения не найден' });
      }
    }

    const newTask = new TaskList({
      title,
      description,
      assignedTo: assignedTo || req.user.id, // Если не указан, назначаем создателю
      createdBy: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      category
    });

    const savedTask = await newTask.save();
    console.log('✅ Задача создана:', savedTask._id);

    // Заполняем связи для возврата полной информации
    const populatedTask = await TaskList.findById(savedTask._id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName');

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error('❌ Ошибка создания задачи:', err);
    res.status(400).json({ error: 'Ошибка создания задачи' });
 }
});

// Обновить задачу
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    console.log('✏️ Обновление задачи:', req.params.id, req.body);

    const taskId = req.params.id;
    const { title, description, assignedTo, completed, dueDate, priority, category } = req.body;

    // Проверяем, существует ли задача и принадлежит ли пользователю (или он админ)
    const task = await TaskList.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверка прав на редактирование
    const canEdit = req.user.role === 'admin' || 
                   req.user.id === task.createdBy.toString() ||
                   req.user.id === task.assignedTo?.toString();
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Нет прав на редактирование задачи' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(400).json({ error: 'Пользователь для назначения не найден' });
      }
      updateData.assignedTo = assignedTo;
    }
    if (completed !== undefined) updateData.completed = completed;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;

    const updatedTask = await TaskList.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    ).populate('assignedTo', 'fullName').populate('createdBy', 'fullName');

    console.log('✅ Задача обновлена:', taskId);

    res.json(updatedTask);
  } catch (err) {
    console.error('❌ Ошибка обновления задачи:', err);
    res.status(400).json({ error: 'Ошибка обновления задачи' });
  }
});

// Удалить задачу
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    console.log('🗑️ Удаление задачи:', req.params.id);

    const taskId = req.params.id;

    // Проверяем, существует ли задача и принадлежит ли пользователю (или он админ)
    const task = await TaskList.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    // Проверка прав на удаление
    const canDelete = req.user.role === 'admin' || req.user.id === task.createdBy.toString();
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Нет прав на удаление задачи' });
    }

    await TaskList.findByIdAndDelete(taskId);

    console.log('✅ Задача удалена:', taskId);

    res.json({ message: 'Задача успешно удалена' });
  } catch (err) {
    console.error('❌ Ошибка удаления задачи:', err);
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});

// Отметить задачу как выполненную/невыполненную
router.patch('/:id/toggle', authMiddleware, async (req: any, res) => {
  try {
    console.log('🔄 Переключение статуса задачи:', req.params.id);

    const taskId = req.params.id;

    // Проверяем, существует ли задача и назначена ли пользователю (или он админ)
    const task = await TaskList.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const canToggle = req.user.role === 'admin' || 
                     req.user.id === task.assignedTo?.toString() ||
                     req.user.id === task.createdBy.toString();
    
    if (!canToggle) {
      return res.status(403).json({ error: 'Нет прав на изменение статуса задачи' });
    }

    // Переключаем статус выполнения
    task.completed = !task.completed;
    const updatedTask = await task.save();

    console.log('✅ Статус задачи изменен:', taskId, 'Выполнена:', updatedTask.completed);

    res.json(updatedTask);
  } catch (err) {
    console.error('❌ Ошибка переключения статуса задачи:', err);
    res.status(500).json({ error: 'Ошибка переключения статуса задачи' });
  }
});

export default router;