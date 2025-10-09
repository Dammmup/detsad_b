import { Request, Response } from 'express';
import { UserService } from './service';
import { AuthenticatedRequest } from '../../types/express';
import { hashPassword } from '../../utils/hash';
import Payroll from '../payroll/model';
import Fine from '../fine/model';

const userService = new UserService();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const includePasswords = req.query.includePasswords === 'true';
    console.log('🔍 User requesting users list:', (req as any).user?.fullName, 'Role:', (req as any).user?.role);
    console.log('🔍 Include passwords requested:', includePasswords);
    // if passwords requested, verify requesting user is admin
    if (includePasswords && (req as any).user?.role !== 'admin') {
      console.log('❌ Access denied - user role:', (req as any).user?.role, 'required: admin');
      return res.status(403).json({ error: 'Forbidden' });
    }
    const users = await userService.getAll(includePasswords);
    console.log('🔍 Найдено пользователей:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Ошибка при получении списка пользователей', details: error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
 } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
};

export const createUser = async (req: Request, res: Response) => {
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
      userData.passwordHash = await hashPassword(plainPassword);
      // Сохраняем оригинальный пароль для отображения в интерфейсе
      userData.initialPassword = plainPassword;
    }

    console.log('userData перед сохранением:', userData);
    
    const user = await userService.create(userData);
    
    // Исключаем passwordHash из ответа
    const userObj = user.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;
    
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
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    
    if (error && typeof error === 'object' && (error as any).code === 11000) {
      // Логируем детали конфликта
      console.error('Конфликт уникального индекса:', {
        code: (error as any).code,
        keyPattern: (error as any).keyPattern,
        keyValue: (error as any).keyValue,
        message: (error as any).message
      });
      
      // Определяем, какое поле вызывает конфликт
      let conflictField = 'неизвестное поле';
      if ((error as any).keyPattern && (error as any).keyPattern.phone) {
        conflictField = 'номер телефона';
      } else if ((error as any).keyPattern && (error as any).keyPattern.email) {
        conflictField = 'email';
      } else if ((error as any).keyPattern && (error as any).keyPattern.username) {
        conflictField = 'имя пользователя';
      }
      
      return res.status(409).json({
        error: `Пользователь с таким ${conflictField} уже существует`,
        conflictField: (error as any).keyPattern,
        conflictValue: (error as any).keyValue
      });
    }
    res.status(500).json({ error: (error as Error).message || 'Ошибка сервера' });
 }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Обновление заметок и других полей
    if (req.body !== undefined && user) {
      if (req.body.notes !== undefined) user.notes = req.body.notes;
      if (req.body.role !== undefined) user.role = req.body.role;
      if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
      if (req.body.active !== undefined) user.active = req.body.active;
      if (req.body.iin !== undefined) user.iin = req.body.iin;
      if (req.body.groupId !== undefined) user.groupId = req.body.groupId;
    }

    const updatedUser = await userService.update(req.params.id, user.toObject());
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }
    // исключаем passwordHash
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных пользователя', details: error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
 }
};

// Обновить зарплатные и штрафные настройки сотрудника
export const updatePayrollSettings = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (req.body.salaryType) user.salaryType = req.body.salaryType;
    if (req.body.salary !== undefined) user.salary = req.body.salary;
    if (req.body.penaltyType) user.penaltyType = req.body.penaltyType;
    if (req.body.penaltyAmount !== undefined) user.penaltyAmount = req.body.penaltyAmount;
    const updatedUser = await userService.update(req.params.id, user.toObject());
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete (userObj as any).passwordHash;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: 'Error updating payroll settings' });
  }
};

// Get available user roles
export const getUserRoles = (req: Request, res: Response) => {
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
};

// Update user salary
export const updateUserSalary = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.salary = req.body.salary;
    const updatedUser = await userService.update(req.params.id, user.toObject());
    console.log('Updated user salary:', updatedUser, req.body.salary);
    res.json(updatedUser);
  } catch (err) {
    res.status(50).json({ error: 'Error updating user salary' });
  }
};

// Add a fine to user (create Fine document, update user's totalFines)
export const addUserFine = async (req: Request, res: Response) => {
  try {
    if (!(req as AuthenticatedRequest).user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const authReq = req as AuthenticatedRequest;
    const { amount, reason, type = 'other', notes } = req.body;
    const userId = req.params.id;
    const createdBy = authReq.user.id; // Now we know user is defined

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    const user = await userService.getById(userId);
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
    await userService.update(userId, user.toObject());

    res.status(201).json(fineDoc);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
};

// Get all fines for a user (from Fine collection)
export const getUserFines = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fines = await Fine.find({ user: req.params.id }).sort({ date: -1 });
    res.json({ fines, totalFines: user.totalFines || 0 });
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
};

// Remove a fine
export const removeUserFine = async (req: Request, res: Response) => {
  try {
    const { userId, fineId } = req.params;
    const fine = await Fine.findByIdAndDelete(fineId);
    if (!fine) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    const user = await userService.getById(userId);
    if (user) {
      user.totalFines = (user.totalFines || 0) - Number(fine.amount || 0);
      await userService.update(userId, user.toObject());
    }
    res.json({ message: 'Fine removed successfully' });
 } catch (error) {
    console.error('Error removing fine:', error);
    res.status(500).json({ error: 'Error removing fine' });
  }
};

// Calculate total fines for a user
export const getUserTotalFines = async (req: Request, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ totalFines: user.totalFines || 0 });
  } catch (error) {
    console.error('Error calculating total fines:', error);
    res.status(500).json({ error: 'Error calculating total fines' });
  }
};