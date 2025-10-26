import { Request, Response } from 'express';
import { UserService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { hashPassword } from '../../utils/hash';
import Payroll from '../payroll/model';
import Fine from '../fine/model';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const userService = new UserService();

export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const includePasswords = req.query.includePasswords === 'true';
    console.log('🔍 User requesting users list:', req.user?.fullName, 'Role:', req.user?.role);
    console.log('🔍 Include passwords requested:', includePasswords);
    
    // Проверяем права доступа
    // Только администраторы могут запрашивать пароли
    if (includePasswords && req.user?.role !== 'admin') {
      console.log('❌ Access denied - user role:', req.user?.role, 'required: admin');
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Для обычных пользователей возвращаем только базовую информацию
    const users = await userService.getAll(includePasswords);
    console.log('🔍 Найдено пользователей:', users.length);
    
    // Если пользователь не администратор, возвращаем только базовую информацию
    if (req.user.role !== 'admin') {
      const filteredUsers = users.map(user => {
        // Исключаем чувствительные данные для обычных пользователей
        const userObj = user.toObject();
        const { passwordHash, initialPassword, ...filteredUser } = userObj;
        return {
          ...filteredUser,
          // Возвращаем только необходимые поля
          _id: filteredUser._id,
          id: filteredUser._id,
          fullName: filteredUser.fullName,
          role: filteredUser.role,
          phone: filteredUser.phone,
          avatar: filteredUser.avatar,
          isActive: filteredUser.active,
          createdAt: filteredUser.createdAt,
          updatedAt: filteredUser.updatedAt,
          uniqNumber: filteredUser.uniqNumber,
          notes: filteredUser.notes,
          active: filteredUser.active,
          iin: filteredUser.iin,
          groupId: filteredUser.groupId,
          birthday: filteredUser.birthday,
          photo: filteredUser.photo,
          parentName: filteredUser.parentName,
          parentPhone: filteredUser.parentPhone,
          email: filteredUser.email,
          staffId: filteredUser.staffId,
          staffName: filteredUser.staffName
        };
      });
      
      res.json(filteredUsers);
    } else {
      // Для администраторов - возвращаем полную информацию
      // Но исключаем passwordHash для безопасности
      const usersWithFilteredPasswords = users.map(user => {
        const userObj = user.toObject();
        if (userObj.passwordHash) delete userObj.passwordHash;
        return userObj;
      });
      res.json(usersWithFilteredPasswords);
    }
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Ошибка при получении списка пользователей', details: error });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    // Проверяем права доступа
    // Пользователь может получить информацию только о себе или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      // Для обычных пользователей возвращаем только базовую информацию
      const userObj = user.toObject();
      const { passwordHash, ...filteredUser } = userObj;
      // Обычный пользователь может видеть только свой initialPassword
      if (req.user.id === req.params.id) {
        res.json({
          ...filteredUser,
          initialPassword: userObj.initialPassword
        });
      } else {
        const { initialPassword, ...nonPasswordUser } = filteredUser;
        res.json({
          _id: nonPasswordUser._id,
          id: nonPasswordUser._id,
          fullName: nonPasswordUser.fullName,
          role: nonPasswordUser.role,
          phone: nonPasswordUser.phone,
          avatar: nonPasswordUser.avatar,
          isActive: nonPasswordUser.active,
          createdAt: nonPasswordUser.createdAt,
          updatedAt: nonPasswordUser.updatedAt,
          uniqNumber: nonPasswordUser.uniqNumber,
          notes: nonPasswordUser.notes,
          active: nonPasswordUser.active,
          iin: nonPasswordUser.iin,
          groupId: nonPasswordUser.groupId,
          birthday: nonPasswordUser.birthday,
          photo: nonPasswordUser.photo,
          parentName: nonPasswordUser.parentName,
          parentPhone: nonPasswordUser.parentPhone,
          email: nonPasswordUser.email,
          staffId: nonPasswordUser.staffId,
          staffName: nonPasswordUser.staffName
        });
      }
    } else {
      // Для администраторов и владельца - возвращаем полную информацию
      // Но исключаем passwordHash для безопасности
      const userObj = user.toObject();
      if (userObj.passwordHash) delete userObj.passwordHash;
      res.json(userObj);
    }
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
        const exists = await Payroll.findOne({ staffId: user._id, period: month });
        if (!exists) {
          await Payroll.create({
            staffId: user._id,
            period: month,
            baseSalary: Number((user as any).salary || 0),
            bonuses: 0,
            deductions: 0,
            accruals: 0,
            penalties: 0,
            total: 0,
            status: 'draft',
            history: []
          });
          console.log(`✅ Payroll создан для сотрудника ${user.fullName} за период ${month}`);
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

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    // Проверяем права доступа
    // Пользователь может обновлять только свои данные или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update this user' });
    }
 
    // Обновление заметок и других полей
    if (req.body !== undefined && user) {
      if (req.body.notes !== undefined) user.notes = req.body.notes;
      // Только администратор может изменять роль
      if (req.body.role !== undefined && req.user.role === 'admin') user.role = req.body.role;
      if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
      // Только администратор может изменять активность
      if (req.body.active !== undefined && req.user.role === 'admin') user.active = req.body.active;
      if (req.body.iin !== undefined) user.iin = req.body.iin;
      if (req.body.groupId !== undefined) user.groupId = req.body.groupId;
      // Обновление начального пароля
      if (req.body.initialPassword !== undefined) {
        // Пользователь может изменять свой initialPassword, но не может изменить его для другого пользователя
        if (req.user.role === 'admin' || req.user.id === req.params.id) {
          // Проверяем, что пароль не пустой
          if (req.body.initialPassword && typeof req.body.initialPassword === 'string') {
            user.initialPassword = req.body.initialPassword;
            // Также обновляем passwordHash для входа в систему
            (user as any).passwordHash = await hashPassword(req.body.initialPassword);
          } else {
            // Если пароль пустой, возвращаем ошибку
            return res.status(400).json({ error: 'Пароль не может быть пустым' });
          }
        } else {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions to change password' });
        }
      }
      // Обновление фото
      if (req.body.photo !== undefined) user.photo = req.body.photo;
    }
 
    const updatedUser = await userService.update(req.params.id, user.toObject());
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }
    // исключаем passwordHash, но оставляем initialPassword для владельца аккаунта
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;
    // Проверяем, является ли пользователь владельцем аккаунта или администратором
    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      res.json(userObj);
    } else {
      // Для обычных пользователей убираем initialPassword
      const { initialPassword, ...filteredUser } = userObj;
      res.json(filteredUser);
    }
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных пользователя', details: error });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администратор может удалять пользователей
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete users' });
    }
    
    const result = await userService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
};

// Обновить зарплатные и штрафные настройки сотрудника
export const updatePayrollSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администратор может обновлять настройки зарплаты
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update payroll settings' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Persist salary and penalty settings directly on user for now
    if (req.body.salary !== undefined) (user as any).salary = Number(req.body.salary);
    if (req.body.shiftRate !== undefined) (user as any).shiftRate = Number(req.body.shiftRate);
    if (req.body.salaryType !== undefined) (user as any).salaryType = req.body.salaryType;
    if (req.body.penaltyType !== undefined) (user as any).penaltyType = req.body.penaltyType;
    if (req.body.penaltyAmount !== undefined) (user as any).penaltyAmount = Number(req.body.penaltyAmount);
    if (req.body.payroll !== undefined) (user as any).payroll = req.body.payroll;
    const updatedUser = await userService.update(req.params.id, user.toObject());
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete (userObj as any).passwordHash;
    // Проверяем, является ли пользователь владельцем аккаунта или администратором
    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      res.json(userObj);
    } else {
      // Для обычных пользователей убираем initialPassword
      const { initialPassword, ...filteredUser } = userObj;
      res.json(filteredUser);
    }
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
export const updateUserSalary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администратор может обновлять зарплату
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update user salary' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // В новой архитектуре зарплата хранится в отдельной коллекции
    // Здесь можно реализовать логику обновления соответствующей записи
    const updatedUser = await userService.update(req.params.id, user.toObject());
    console.log('Updated user salary:', updatedUser, req.body.salary);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Error updating user salary' });
  }
};

// Add a fine to user (create Fine document, update user's totalFines)
export const addUserFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администратор может добавлять штрафы
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to add fines' });
    }
    
    const { amount, reason, type = 'other', notes } = req.body;
    const userId = req.params.id;
    const createdBy = req.user.id; // Now we know user is defined

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

    // В новой архитектуре штрафы могут храниться в отдельной коллекции
    // или в связанной записи зарплаты
    await userService.update(userId, user.toObject());

    res.status(201).json(fineDoc);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
};

// Get all fines for a user (from Fine collection)
export const getUserFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем права доступа
    // Пользователь может получить штрафы только для себя или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }
 
    const fines = await Fine.find({ user: req.params.id }).sort({ date: -1 });
    res.json({ fines, totalFines: 0 }); // Временно возвращаем 0, пока не реализована новая логика
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
};

// Remove a fine
export const removeUserFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администратор может удалять штрафы
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to remove fines' });
    }
    
    const { userId, fineId } = req.params;
    const fine = await Fine.findByIdAndDelete(fineId);
    if (!fine) {
      return res.status(404).json({ error: 'Fine not found' });
    }
    const user = await userService.getById(userId);
    if (user) {
      // В новой архитектуре штрафы могут храниться в отдельной коллекции
      // или в связанной записи зарплаты
      await userService.update(userId, user.toObject());
    }
    res.json({ message: 'Fine removed successfully' });
  } catch (error) {
    console.error('Error removing fine:', error);
    res.status(500).json({ error: 'Error removing fine' });
  }
};

// Calculate total fines for a user
export const getUserTotalFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем права доступа
    // Пользователь может получить информацию о штрафах только для себя или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }
    
    res.json({ totalFines: 0 }); // Временно возвращаем 0, пока не реализована новая логика
  } catch (error) {
    console.error('Error calculating total fines:', error);
    res.status(500).json({ error: 'Error calculating total fines' });
  }
};