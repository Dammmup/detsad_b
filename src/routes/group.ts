import express from 'express';
import Group from '../models/Group';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    // First, try to find groups without populating
    let groups = await Group.find();
    
    // Временно убираем populate teacher, чтобы избежать ошибок с моделью
    // TODO: Восстановить populate когда модели будут правильно настроены
    console.log('📋 Загружен список групп:', groups.length, 'групп(ы)');
    
    // groups = await Promise.all(groups.map(async (group) => {
    //   if (group.teacher) {
    //     try {
    //       await group.populate('teacher', 'fullName');
    //     } catch (populateError) {
    //       console.error('Error populating teacher:', populateError);
    //       // If population fails, keep the original teacher ID
    //     }
    //   }
    //   return group;
    // }));
    
    res.json(groups);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in GET /groups:', errorMessage);
    res.status(500).json({ 
      error: 'Ошибка при получении списка групп',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get single group by ID
router.get('/:id', async (req, res) => {
  try {
    // First, try to find the group without populating
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Временно убираем populate teacher для одной группы
    // TODO: Восстановить populate когда модели будут правильно настроены
    console.log('📄 Загружена группа:', group.name);
    
    // if (group.teacher) {
    //   try {
    //     await group.populate('teacher', 'fullName');
    //   } catch (populateError) {
    //     console.error('Error populating teacher:', populateError);
    //     // If population fails, keep the original teacher ID
    //   }
    // }
    
    res.json(group);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error in GET /groups/${req.params.id}:`, errorMessage);
    res.status(500).json({ 
      error: 'Ошибка при получении данных группы',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Create new group (admin, teacher)
router.post('/', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    console.log('📥 Получен запрос на создание группы:', req.body);
    console.log('👤 Текущий пользователь:', req.user);
    
    // Подготавливаем данные для создания группы
    const groupData = {
      name: req.body.name,
      description: req.body.description || '',
      maxStudents: req.body.maxStudents || 20,
      ageGroup: req.body.ageGroup,
      isActive: req.body.isActive !== false, // по умолчанию true
      // Автоматически назначаем текущего пользователя как teacher
      teacher: req.body.teacher === 'auto' || !req.body.teacher ? req.user.id : req.body.teacher,
      createdBy: req.user.id,
    };
    
    console.log('📤 Создаю группу с данными:', groupData);
    
    const group = new Group(groupData);
    await group.save();
    
    console.log('✅ Группа успешно создана:', group.name);
    res.status(201).json(group);
    
  } catch (err) {
    const error = err as Error;
    console.error('❌ Ошибка создания группы:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Update group (admin, teacher)
router.put('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Проверка прав доступа (только админ или создатель группы)
    if (req.user.role !== 'admin' && group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования группы' });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedGroup);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Delete group (admin, teacher)
router.delete('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Проверка прав доступа (только админ или создатель группы)
    if (
      req.user.role !== 'admin' &&
      (!group.createdBy || group.createdBy.toString() !== req.user.id)
    ) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления группы' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Группа успешно удалена' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;
