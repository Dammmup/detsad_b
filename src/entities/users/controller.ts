import { Request, Response } from 'express';
import { UserService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { hashPassword } from '../../utils/hash';
import Payroll from '../payroll/model';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { logAction, computeChanges } from '../../utils/auditLogger';


interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const userService = new UserService();


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



    if (includePasswords && req.user?.role !== 'admin') {
      console.log('❌ Access denied - user role:', req.user?.role, 'required: admin');
      return res.status(403).json({ error: 'Forbidden' });
    }


    const users = await userService.getAll(includePasswords);
    console.log('🔍 Найдено пользователей:', users.length);


    if (req.user.role !== 'admin') {
      const filteredUsers = users.map(user => {
        const { passwordHash, initialPassword, ...filteredUser } = user as any;
        return {
          ...filteredUser,

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


      const usersWithFilteredPasswords = users.map(user => {
        const userObj = user as any;
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



    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {

      const userObj = user as any;
      const { passwordHash, ...filteredUser } = userObj;

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


      const userObj = user as any;
      if (userObj.passwordHash) delete userObj.passwordHash;
      res.json(userObj);
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении данных пользователя' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {

    console.log('POST /users req.body:', req.body);


    let requiredFields: string[] = ['fullName', 'phone', 'role', 'active'];

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


    const userData: any = {
      ...req.body,
      uniqNumber: req.body.iin || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      createdBy: req.user?.id || null,

      _id: undefined
    };


    if (req.body.groupId) {
      userData.groupId = req.body.groupId;
    }


    if (!userData.passwordHash) {

      const plainPassword = "password123";
      console.log(`🔄 Установлен стандартный пароль для нового сотрудника ${userData.fullName}: ${plainPassword}`);


      userData.password = plainPassword;
      userData.passwordHash = await hashPassword(plainPassword);

      userData.initialPassword = plainPassword;
    }

    console.log('userData перед сохранением:', userData);

    const user = await userService.create(userData);


    const userObj = (user as any).toObject ? (user as any).toObject() : user;
    if (userObj.passwordHash) delete userObj.passwordHash;


    console.log(`✅ Сотрудник создан: ${userData.fullName}`);


    if (user.role !== 'admin' && user.role !== 'child') {
      try {
        const month = new Date().toISOString().slice(0, 7);
        const exists = await Payroll.findOne({ staffId: user._id, period: month });
        if (!exists) {
          await Payroll.create({
            staffId: user._id,
            period: month,
            baseSalary: 180000,
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
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'create',
      entityType: 'staff',
      entityId: user._id.toString(),
      entityName: user.fullName || ''
    });

    res.status(201).json(userObj);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);

    if (error && typeof error === 'object' && (error as any).code === 11000) {

      console.error('Конфликт уникального индекса:', {
        code: (error as any).code,
        keyPattern: (error as any).keyPattern,
        keyValue: (error as any).keyValue,
        message: (error as any).message
      });


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



    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update this user' });
    }


    if (req.body !== undefined && user) {
      if (req.body.notes !== undefined) user.notes = req.body.notes;

      if (req.body.role !== undefined && req.user.role === 'admin') user.role = req.body.role;
      if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
      if (req.body.phone !== undefined) user.phone = req.body.phone;

      if (req.body.active !== undefined && req.user.role === 'admin') user.active = req.body.active;
      if (req.body.iin !== undefined) user.iin = req.body.iin;
      if (req.body.groupId !== undefined) user.groupId = req.body.groupId;



      if (req.body.initialPassword !== undefined) {

        if (req.user.role === 'admin' || req.user.id === req.params.id) {

          if (req.body.initialPassword && typeof req.body.initialPassword === 'string') {
            user.initialPassword = req.body.initialPassword;

            (user as any).passwordHash = await hashPassword(req.body.initialPassword);
          } else {

            return res.status(400).json({ error: 'Пароль не может быть пустым' });
          }
        } else {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions to change password' });
        }
      }

      if (req.body.photo !== undefined) user.photo = req.body.photo;

      if (req.body.accessControls !== undefined && req.user.role === 'admin') {
        user.accessControls = req.body.accessControls;
      }
    }

    const updatedUser = await userService.update(req.params.id, user);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }

    // Обновляем updatedBy
    (updatedUser as any).updatedBy = req.user!.id;
    await (updatedUser as any).save();

    const userObj = (updatedUser as any).toObject ? (updatedUser as any).toObject() : updatedUser;
    if (userObj.passwordHash) delete userObj.passwordHash;

    const changes = computeChanges(
      {},
      req.body,
      ['fullName', 'phone', 'role', 'active', 'groupId', 'iin', 'notes', 'photo', 'accessControls']
    );
    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'update',
      entityType: 'staff',
      entityId: req.params.id,
      entityName: updatedUser.fullName || '',
      changes
    });

    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      res.json(userObj);
    } else {

      const { initialPassword, ...filteredUser } = userObj;
      res.json(filteredUser);
    }
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных пользователя', details: error });
  }
};


export const generateTelegramCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await userService.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });



    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update this user' });
    }


    const telegramLinkCode = generateTelegramLinkCode();


    const updatedUser = await userService.update(req.params.id, { telegramLinkCode });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }


    const userObj = (updatedUser as any).toObject ? (updatedUser as any).toObject() : updatedUser;
    if (userObj.passwordHash) delete userObj.passwordHash;

    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      res.json({
        ...userObj,
        telegramLinkCode
      });
    } else {

      const { initialPassword, ...filteredUser } = userObj;
      res.json({
        ...filteredUser,
        telegramLinkCode
      });
    }
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при генерации кода для привязки Telegram', details: error });
  }
};


export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.params.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;


    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to change password' });
    }


    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return res.status(400).json({ error: 'Новый пароль не может быть пустым' });
    }


    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }


    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }


    const newPasswordHash = await hashPassword(newPassword.trim());


    user.initialPassword = newPassword.trim();
    (user as any).passwordHash = newPasswordHash;

    const updatedUser = await userService.update(userId, user);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден после обновления' });
    }


    const userObj = (updatedUser as any).toObject ? (updatedUser as any).toObject() : updatedUser;
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


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete users' });
    }

    const oldUser = await userService.getById(req.params.id);
    const result = await userService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Пользователь не найден' });

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'delete',
      entityType: 'staff',
      entityId: req.params.id,
      entityName: oldUser?.fullName || ''
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении пользователя' });
  }
};



export const updatePayrollSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update payroll settings' });
    }

    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const period = req.body.period || new Date().toISOString().slice(0, 7);


    let payroll = await Payroll.findOne({ staffId: req.params.id, period });

    if (!payroll) {
      payroll = new Payroll({
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
      payroll: await Payroll.findById(payroll._id).populate('staffId', 'fullName role')
    });
  } catch (err) {
    console.error('Error updating payroll settings:', err);
    res.status(500).json({ error: 'Error updating payroll settings' });
  }
};


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
      { id: 'rent', name: 'Аренда' },
      { id: 'educator', name: 'Педагог' }
    ];
    res.json(roles);
  } catch (err) {
    res.status(50).json({ error: 'Ошибка при получении списка ролей' });
  }
};


export const updateUserSalary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update user salary' });
    }

    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const updatedUser = await userService.update(req.params.id, user);
    console.log('Updated user salary:', updatedUser, req.body.salary);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Error updating user salary' });
  }
};


export const addUserFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to add fines' });
    }

    const { amount, reason, type = 'other', notes, period } = req.body;
    const userId = req.params.id;
    const createdBy = req.user.id;

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }


    const finePeriod = period || new Date().toISOString().slice(0, 7);


    let payroll = await Payroll.findOne({
      staffId: userId,
      period: finePeriod
    });

    if (!payroll) {

      payroll = new Payroll({
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


    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;
    payroll.penalties = (payroll.penalties || 0) + fine.amount;
    payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

    await payroll.save();

    const populatedPayroll = await Payroll.findById(payroll._id).populate('staffId', 'fullName role telegramChatId');

    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `Вам добавлен Вычет за период ${populatedPayroll.period}:\n` +
        `Сумма: ${fine.amount} тг\n` +
        `Причина: ${fine.reason}\n` +
        `Тип: ${fine.type}\n` +
        `Итого Вычетов за период: ${populatedPayroll.userFines} тг`;
      await sendLogToTelegram(msg);
    }

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'update',
      entityType: 'staff',
      entityId: userId,
      entityName: (populatedPayroll?.staffId as any)?.fullName || '',
      details: `Добавлен штраф: ${amount} тг — ${reason}`
    });

    res.status(201).json(populatedPayroll);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
};


export const getUserFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.params.id;



    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }


    const payrolls = await Payroll.find({ staffId: userId }).sort({ period: -1 });


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


    allFines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ fines: allFines, totalFines: allFines.length });
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
};


export const removeUserFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to remove fines' });
    }

    const { payrollId, fineIndex } = req.params;


    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }


    const fineIndexNum = Number(fineIndex);
    if (!payroll.fines || fineIndexNum < 0 || fineIndexNum >= payroll.fines.length) {
      return res.status(404).json({ error: 'Fine not found' });
    }


    const removedFine = payroll.fines.splice(fineIndexNum, 1)[0];
    const fineAmount = removedFine.amount;


    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;
    payroll.penalties = Math.max(0, (payroll.penalties || 0) - fineAmount);
    payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

    await payroll.save();

    const populatedPayroll = await Payroll.findById(payroll._id).populate('staffId', 'fullName role telegramChatId');

    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `С вас снят Вычет за период ${populatedPayroll.period}:\n` +
        `Сумма: ${fineAmount} тг\n` +
        `Причина: ${removedFine.reason}\n` +
        `Итого Вычетов за период: ${populatedPayroll.userFines} тг`;
      await sendLogToTelegram(msg);
    }

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'update',
      entityType: 'staff',
      entityId: req.params.id,
      entityName: (populatedPayroll?.staffId as any)?.fullName || '',
      details: `Удалён штраф: ${fineAmount} тг — ${removedFine.reason}`
    });

    res.json({ message: 'Fine removed successfully', updatedPayroll: populatedPayroll });
  } catch (error) {
    console.error('Error removing fine:', error);
    res.status(500).json({ error: 'Error removing fine' });
  }
};


export const getUserTotalFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.params.id;



    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s fines' });
    }


    const payrolls = await Payroll.find({ staffId: userId });


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

export const updateAllowToSeePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Только администратор может изменять это поле
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can change this setting' });
    }

    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { allowToSeePayroll } = req.body;

    if (allowToSeePayroll === undefined) {
      return res.status(400).json({ error: 'allowToSeePayroll field is required' });
    }

    // Обновляем поле allowToSeePayroll
    (user as any).allowToSeePayroll = allowToSeePayroll;

    const updatedUser = await userService.update(req.params.id, user);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    const userObj = (updatedUser as any).toObject ? (updatedUser as any).toObject() : updatedUser;
    if (userObj.passwordHash) delete userObj.passwordHash;

    res.json({
      message: 'Allow to see payroll setting updated',
      user: userObj
    });
  } catch (error) {
    console.error('Error updating allowToSeePayroll:', error);
    res.status(500).json({ error: 'Error updating allowToSeePayroll setting' });
  }
};


