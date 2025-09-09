import express, { Response, Request } from 'express';
import User, { IFine, IUser } from '../models/Users';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

/**
 * Генерация персонального кода (6 символов: буквы + цифры)
 */
function generatePersonalCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Проверка уникальности персонального кода
 */
async function generateUniquePersonalCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generatePersonalCode();
    const existingUser = await User.findOne({ personalCode: code });
    
    if (!existingUser) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Не удалось сгенерировать уникальный персональный код');
}

// Get available user roles
router.get('/roles', (req, res) => {
  try {
    const roles = [
      { id: 'admin', name: 'Администратор' },
      { id: 'teacher', name: 'Воспитатель' },
      { id: 'assistant', name: 'Помощник воспитателя' },
      { id: 'nurse', name: 'Медсестра' },
      { id: 'cook', name: 'Повар' },
      { id: 'cleaner', name: 'Уборщица' },
      { id: 'security', name: 'Охранник' },
      { id: 'psychologist', name: 'Психолог' },
      { id: 'music_teacher', name: 'Музыкальный руководитель' },
      { id: 'physical_teacher', name: 'Инструктор по физкультуре' },
      { id: 'staff', name: 'Персонал' }
    ];
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении списка ролей' });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }, '-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация/создание пользователя


router.post('/', async (req, res) => {
  try {
    // Логируем тело запроса для отладки
    console.log('POST /users req.body:', req.body);

    // Валидация
    const { type = 'adult' } = req.body;
    let requiredFields: string[] = ['fullName'];

    if (type === 'adult') {
      requiredFields.push('phone', 'role', 'active');
    }
    if (type === 'child') {
      requiredFields.push('iin', 'groupId', 'parentPhone', 'parentName');
    }

    // Детальная проверка каждого поля для отладки
    console.log('Проверка обязательных полей:');
    requiredFields.forEach(field => {
      const val = req.body[field];
      console.log(`${field}:`, val, typeof val, val === undefined, val === null, typeof val === 'string' && val.trim().length === 0);
    });

    const missingFields = requiredFields.filter(field => {
      const val = req.body[field];
      // Более гибкая проверка
      if (val === undefined || val === null) return true;
      if (typeof val === 'string' && val.trim().length === 0) return true;
      if (typeof val === 'number' && isNaN(val)) return true;
      return false;
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Не заполнены обязательные поля',
        missingFields
      });
    }

    // Здесь req.body содержит все нужные поля для создания пользователя
    // Например:
    // const newUser = new UserModel(req.body);
    // await newUser.save();

    const userData: any = {
      ...req.body,
      uniqNumber: req.body.iin || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ИИН или временный уникальный ID
      createdAt: new Date()
    };

    // Add groupId if provided
    if (req.body.groupId) {
      userData.groupId = req.body.groupId;
    }

    // Генерируем персональный код для сотрудников
    if (type === 'adult') {
      try {
        userData.personalCode = await generateUniquePersonalCode();
        console.log('🔑 Сгенерирован персональный код для сотрудника:', userData.personalCode);
      } catch (error) {
        console.error('❌ Ошибка генерации персонального кода:', error);
        return res.status(500).json({ error: 'Ошибка генерации персонального кода' });
      }
    }

    console.log('userData перед сохранением:', userData);
    
    const user = new User(userData);
    await user.save();
    
    // Исключаем passwordHash из ответа
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    
    // Логируем успешное создание
    if (type === 'adult' && userData.personalCode) {
      console.log(`✅ Сотрудник создан: ${userData.fullName}, персональный код: ${userData.personalCode}`);
    }
    
    res.status(201).json(userObj);
  } catch (err: any) {
    console.error('Ошибка при создании пользователя:', err);
    
    if (err.code === 11000) {
      // Логируем детали конфликта
      console.error('Конфликт уникального индекса:', {
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
        message: err.message
      });
      
      // Определяем, какое поле вызывает конфликт
      let conflictField = 'неизвестное поле';
      if (err.keyPattern && err.keyPattern.phone) {
        conflictField = 'номер телефона';
      } else if (err.keyPattern && err.keyPattern.email) {
        conflictField = 'email';
      } else if (err.keyPattern && err.keyPattern.username) {
        conflictField = 'имя пользователя';
      }
      
      return res.status(409).json({ 
        error: `Пользователь с таким ${conflictField} уже существует`,
        conflictField: err.keyPattern,
        conflictValue: err.keyValue
      });
    }
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

// Получить пользователя по id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id format' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновление заметок
    if (req.body.notes !== undefined) {
      user.notes = req.body.notes;
    }

    // Обновление полей пользователя
 
    if (req.body.active !== undefined) {
      user.active = req.body.active;
    }

    if (req.body.iin !== undefined) {
      user.iin = req.body.iin;
    }

    await user.save();
    // исключаем passwordHash
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Update user salary
router.put('/:id/salary', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.salary = req.body.salary;
    await user.save();
    console.log('Updated user salary:', user, req.body.salary);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error updating user salary' });
  }
});

// Add a fine to user
router.post<{ id: string }, any, { amount: number; reason: string; type?: string; notes?: string }>('/:id/fines', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const authReq = req as AuthenticatedRequest;
    const { amount, reason, type = 'other', notes } = req.body;
    const userId = req.params.id;
    const createdBy = authReq.user.id; // Now we know user is defined

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newFine = {
      amount: Number(amount),
      reason,
      type,
      notes,
      createdBy,
      approved: true, // Auto-approve for now, can be changed
      date: new Date()
    };

    user.fines.push(newFine as any);
    user.totalFines = (user.totalFines || 0) + Number(amount);
    await user.save();

    res.status(201).json(newFine);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
});

// Get all fines for a user
router.get<{ id: string }>('/:id/fines', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id, 'fines totalFines')
      .populate('fines.createdBy', 'firstName lastName')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      fines: user.fines,
      totalFines: user.totalFines || 0
    });
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
});

// Remove a fine
router.delete('/:userId/fines/:fineId', async (req, res) => {
  try {
    const { userId, fineId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fineIndex = user.fines.findIndex((f: any) => f._id && f._id.toString() === fineId);
    if (fineIndex === -1) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const [removedFine] = user.fines.splice(fineIndex, 1);
    user.totalFines = Math.max(0, (user.totalFines || 0) - (removedFine.amount || 0));
    await user.save();

    res.json({ message: 'Fine removed successfully' });
  } catch (error) {
    console.error('Error removing fine:', error);
    res.status(500).json({ error: 'Error removing fine' });
  }
});

// Calculate total fines for a user
router.get('/:id/fines/total', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'totalFines');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ totalFines: user.totalFines || 0 });
  } catch (error) {
    console.error('Error calculating total fines:', error);
    res.status(500).json({ error: 'Error calculating total fines' });
  }
});
export default router;
