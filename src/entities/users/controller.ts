import { Request, Response } from 'express';
import { UserService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { hashPassword } from '../../utils/hash';
import Payroll from '../payroll/model';
import { sendLogToTelegram } from '../../utils/telegramLogger';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const userService = new UserService();

// Генерация уникального кода для привязки Telegram
function generateTelegramLinkCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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
      createdAt: new Date(),
      // Убедимся, что _id не передается при создании нового пользователя
      _id: undefined
    };

    // Add groupId if provided
    if (req.body.groupId) {
      userData.groupId = req.body.groupId;
    }

    // Для staff/adult, если не указан passwordHash, генерируем его
    if (!userData.passwordHash) {
      // Используем стандартный пароль "password123"
      const plainPassword = "password123";
      console.log(`🔄 Установлен стандартный пароль для нового сотрудника ${userData.fullName}: ${plainPassword}`);

      // Устанавливаем пароль для валидации и хэшируем его
      userData.password = plainPassword;
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
        const exists = await Payroll().findOne({ staffId: user._id, period: month });
        if (!exists) {
          await Payroll().create({
            staffId: user._id,
            period: month,
            baseSalary: 180000, // РЕФАКТОРИНГ: Используем дефолтное значение
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
      // Обновление признака арендатора - теперь это роль, поэтому поле больше не используется
      // if (req.body.tenant !== undefined) user.tenant = req.body.tenant;
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

// Generate Telegram link code for a user
export const generateTelegramCode = async (req: AuthenticatedRequest, res: Response) => {
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

    // Генерируем уникальный код для привязки Telegram
    const telegramLinkCode = generateTelegramLinkCode();

    // Обновляем пользователя с новым кодом
    const updatedUser = await userService.update(req.params.id, { telegramLinkCode });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }

    // исключаем passwordHash, но оставляем initialPassword для владельца аккаунта
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;
    // Проверяем, является ли пользователь владельцем аккаунта или администратором
    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      res.json({
        ...userObj,
        telegramLinkCode // Возвращаем код для привязки Telegram
      });
    } else {
      // Для обычных пользователей убираем initialPassword
      const { initialPassword, ...filteredUser } = userObj;
      res.json({
        ...filteredUser,
        telegramLinkCode // Возвращаем код для привязки Telegram
      });
    }
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при генерации кода для привязки Telegram', details: error });
  }
};

// Change password for a user
export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.params.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Проверяем права доступа - только сам пользователь или админ может менять пароль
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to change password' });
    }

    // Проверяем, что новый пароль указан
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return res.status(400).json({ error: 'Новый пароль не может быть пустым' });
    }

    // Проверяем совпадение паролей, если указано подтверждение
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    // Получаем пользователя
    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Хешируем новый пароль
    const newPasswordHash = await hashPassword(newPassword.trim());

    // Обновляем пользователя
    user.initialPassword = newPassword.trim();
    (user as any).passwordHash = newPasswordHash;

    const updatedUser = await userService.update(userId, user.toObject());
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }

    // Исключаем passwordHash из ответа
    const userObj = updatedUser.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;

    console.log(`✅ Пароль изменён для пользователя ${updatedUser.fullName}`);

    res.json({
      success: true,
      message: 'Пароль успешно изменён',
      user: userObj
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Ошибка при изменении пароля', details: error });
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
// РЕФАКТОРИНГ: Теперь сохраняет в Payroll вместо User
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

    // Получаем текущий период
    const period = req.body.period || new Date().toISOString().slice(0, 7);

    // Находим или создаём payroll для этого периода
    let payroll = await Payroll().findOne({ staffId: req.params.id, period });

    if (!payroll) {
      payroll = new (Payroll())({
        staffId: req.params.id,
        period,
        baseSalary: req.body.salary || req.body.baseSalary || 180000,
        baseSalaryType: req.body.salaryType || 'month',
        shiftRate: req.body.shiftRate || 0,
        bonuses: 0,
        deductions: 0,
        accruals: 0,
        penalties: 0,
        total: 0,
        status: 'draft'
      });
    } else {
      // Обновляем существующий payroll
      if (req.body.salary !== undefined || req.body.baseSalary !== undefined) {
        payroll.baseSalary = Number(req.body.salary || req.body.baseSalary);
      }
      if (req.body.shiftRate !== undefined) {
        payroll.shiftRate = Number(req.body.shiftRate);
      }
      if (req.body.salaryType !== undefined) {
        payroll.baseSalaryType = req.body.salaryType;
      }
    }

    await payroll.save();

    res.json({
      message: 'Payroll settings updated',
      payroll: await Payroll().findById(payroll._id).populate('staffId', 'fullName role')
    });
  } catch (err) {
    console.error('Error updating payroll settings:', err);
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
      { id: 'staff', name: 'Персонал' },
      { id: 'rent', name: 'Аренда' }
    ];
    res.json(roles);
  } catch (err) {
    res.status(50).json({ error: 'Ошибка при получении списка ролей' });
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

    const { amount, reason, type = 'other', notes, period } = req.body;
    const userId = req.params.id;
    const createdBy = req.user.id; // Now we know user is defined

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    // Определяем период, если не указан
    const finePeriod = period || new Date().toISOString().slice(0, 7);

    // Получаем или создаем запись зарплаты для указанного периода
    let payroll = await Payroll().findOne({
      staffId: userId,
      period: finePeriod
    });

    if (!payroll) {
      // Создаем новую запись зарплаты, если она не существует
      payroll = new (Payroll())({
        staffId: userId,
        period: finePeriod,
        baseSalary: 0,
        bonuses: 0,
        deductions: 0,
        accruals: 0,
        penalties: 0,
        userFines: 0,
        total: 0,
        status: 'draft'
      });
    }

    // Добавляем штраф к записи зарплаты
    const fine = {
      amount: Number(amount),
      reason,
      type,
      notes,
      date: new Date(),
      createdAt: new Date()
    };

    if (!payroll.fines) {
      payroll.fines = [];
    }
    payroll.fines.push(fine);

    // Обновляем общую сумму штрафов
    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;
    payroll.penalties = (payroll.penalties || 0) + fine.amount;
    payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

    await payroll.save();

    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role telegramChatId');
    // Уведомление в Telegram
    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `Вам добавлен штраф за период ${populatedPayroll.period}:\n` +
        `Сумма: ${fine.amount} тг\n` +
        `Причина: ${fine.reason}\n` +
        `Тип: ${fine.type}\n` +
        `Итого штрафов за период: ${populatedPayroll.userFines} тг`;
      await sendLogToTelegram(msg);
    }

    res.status(201).json(populatedPayroll);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
};

// Get all fines for a user (from Payroll collection)
export const getUserFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.params.id;

    // Проверяем права доступа
    // Пользователь может получить штрафы только для себя или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }

    // Получаем все записи зарплаты для пользователя
    const payrolls = await Payroll().find({ staffId: userId }).sort({ period: -1 });

    // Собираем все штрафы из записей зарплаты
    const allFines = [];
    for (const payroll of payrolls) {
      if (payroll.fines && payroll.fines.length > 0) {
        for (const fine of payroll.fines) {
          allFines.push({
            ...fine,
            period: payroll.period,
            payrollId: payroll._id
          });
        }
      }
    }

    // Сортируем по дате (новые первыми)
    allFines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ fines: allFines, totalFines: allFines.length });
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

    const { payrollId, fineIndex } = req.params;

    // Получаем запись зарплаты
    const payroll = await Payroll().findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    // Проверяем, что индекс штрафа корректный
    const fineIndexNum = Number(fineIndex);
    if (!payroll.fines || fineIndexNum < 0 || fineIndexNum >= payroll.fines.length) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    // Удаляем штраф
    const removedFine = payroll.fines.splice(fineIndexNum, 1)[0];
    const fineAmount = removedFine.amount;

    // Обновляем общую сумму штрафов
    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;
    payroll.penalties = Math.max(0, (payroll.penalties || 0) - fineAmount);
    payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

    await payroll.save();

    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role telegramChatId');
    // Уведомление в Telegram
    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `С вас снят штраф за период ${populatedPayroll.period}:\n` +
        `Сумма: ${fineAmount} тг\n` +
        `Причина: ${removedFine.reason}\n` +
        `Итого штрафов за период: ${populatedPayroll.userFines} тг`;
      await sendLogToTelegram(msg);
    }

    res.json({ message: 'Fine removed successfully', updatedPayroll: populatedPayroll });
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

    const userId = req.params.id;

    // Проверяем права доступа
    // Пользователь может получить информацию о штрафах только для себя или если он администратор
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }

    // Получаем все записи зарплаты для пользователя
    const payrolls = await Payroll().find({ staffId: userId });

    // Суммируем все штрафы
    let totalFines = 0;
    for (const payroll of payrolls) {
      if (payroll.userFines) {
        totalFines += payroll.userFines;
      }
    }

    res.json({ totalFines });
  } catch (error) {
    console.error('Error calculating total fines:', error);
    res.status(500).json({ error: 'Error calculating total fines' });
  }
};