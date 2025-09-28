import express, { Response, Request } from 'express';
import User from '../models/Users';
import Payroll from '../models/Payroll';
import Fine from '../models/Fine';
import Group from '../models/Group';
import ChildAttendance from '../models/ChildAttendance';
import { authMiddleware } from '../middlewares/authMiddleware';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Обновить зарплатные и штрафные настройки сотрудника
router.put('/:id/payroll-settings', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (req.body.salaryType) user.salaryType = req.body.salaryType;
    if (req.body.salary !== undefined) user.salary = req.body.salary;
    if (req.body.penaltyType) user.penaltyType = req.body.penaltyType;
    if (req.body.penaltyAmount !== undefined) user.penaltyAmount = req.body.penaltyAmount;
    await user.save();
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Error updating payroll settings' });
  }
});

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

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const includePasswords = req.query.includePasswords === 'true';
    console.log('🔍 User requesting users list:', req.user?.fullName, 'Role:', req.user?.role);
    console.log('🔍 Include passwords requested:', includePasswords);
    // if passwords requested, verify requesting user is admin
    if (includePasswords && req.user?.role !== 'admin') {
      console.log('❌ Access denied - user role:', req.user?.role, 'required: admin');
      return res.status(403).json({ error: 'Forbidden' });
    }
    const projection = includePasswords ? '+initialPassword -passwordHash' : '-passwordHash';
    // Только staff/adult
    const query: any = { role: { $ne: 'admin' } };
    const users = await User.find(query).select(projection);
    console.log('🔍 Найдено пользователей:', users.length, 'для фильтра:', query);
    res.json(users);
  } catch (err) {
    console.error('Error in GET /users:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация/создание пользователя


router.post('/', async (req, res) => {
  try {
    // Логируем тело запроса для отладки
    console.log('POST /users req.body:', req.body);

    // Валидация только для staff/adult
    let requiredFields: string[] = ['fullName', 'phone', 'role', 'active'];
    // Детальная проверка каждого поля для отладки
    console.log('Проверка обязательных полей:');
    requiredFields.forEach(field => {
      const val = req.body[field];
      console.log(`${field}:`, val, typeof val, val === undefined, val === null, typeof val === 'string' && val.trim().length === 0);
    });
    const missingFields = requiredFields.filter(field => {
      const val = req.body[field];
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

    // Генерация хэшированного пароля для взрослых пользователей без указания пароля
    const userData: any = {
      ...req.body,
      uniqNumber: req.body.iin || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ИИН или временный уникальный ID
      createdAt: new Date()
    };

    // Add groupId if provided
    if (req.body.groupId) {
      userData.groupId = req.body.groupId;
    }

  // Для staff/adult, если не указан passwordHash, генерируем его
  if (!userData.passwordHash) {
      // Генерируем случайный пароль
      const generateRandomPassword = (length: number = 8): string => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      };

      const plainPassword = generateRandomPassword();
      console.log(`🔄 Сгенерирован пароль для нового сотрудника ${userData.fullName}: ${plainPassword}`);

      // Хэшируем пароль
      const { hashPassword } = await import('../utils/hash');
      userData.passwordHash = await hashPassword(plainPassword);
      // Сохраняем оригинальный пароль для отображения в интерфейсе
      userData.initialPassword = plainPassword;
    }

    console.log('userData перед сохранением:', userData);
    
    const user = new User(userData);
    await user.save();
    
    // Исключаем passwordHash из ответа
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    
    // Логируем успешное создание
    console.log(`✅ Сотрудник создан: ${userData.fullName}`);
    
    // После создания сотрудника — создать payroll на текущий месяц (если не admin и не child)
    if (user.role !== 'admin' && user.role !== 'child') {
      try {
        const month = new Date().toISOString().slice(0, 7);
        const exists = await Payroll.findOne({ staffId: user._id, month });
        if (!exists) {
          await Payroll.create({
            staffId: user._id,
            month,
            accruals: 0,
            deductions: 0,
            bonuses: 0,
            penalties: 0,
            total: 0,
            status: 'draft',
            history: []
          });
          console.log(`✅ Payroll создан для сотрудника ${user.fullName} за ${month}`);
        }
      } catch (e) {
        console.error('Ошибка при автосоздании payroll:', e);
      }
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

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    res.json({ 
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error deleting user' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновление заметок
    if (req.body !== undefined) {
      user.notes = req.body.notes;
      user.role=req.body.role;
      user.fullName=req.body.fullName;
      user.phone=req.body.phone;
      user.active=req.body.active;
      user.iin=req.body.iin;
      user.groupId=req.body.groupId;

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

// Add a fine to user (create Fine document, update user's totalFines)
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

    const fineDoc = await Fine.create({
      user: user._id,
      amount: Number(amount),
      reason,
      type,
      notes,
      date: new Date()
    });

    user.totalFines = (user.totalFines || 0) + Number(amount);
    await user.save();

    res.status(201).json(fineDoc);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
});

// Get all fines for a user (from Fine collection)
router.get<{ id: string }>('/:id/fines', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id, 'totalFines');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fines = await Fine.find({ user: req.params.id }).sort({ date: -1 });
    res.json({ fines, totalFines: user.totalFines || 0 });
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
});

// Remove a fine
router.delete('/:userId/fines/:fineId', async (req, res) => {
  try {
    const { userId, fineId } = req.params;
    const fine = await Fine.findByIdAndDelete(fineId);
    if (!fine) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    await User.findByIdAndUpdate(userId, { $inc: { totalFines: -Number(fine.amount || 0) } });
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
// (Удалён endpoint получения детей по группе)

export default router;
