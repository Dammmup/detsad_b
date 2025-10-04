import { Request, Response, NextFunction } from 'express';
import User from '../users/user.model';
import Group from '../groups/group.model';
import Child from '../children/child.model';

// Типы ролей пользователей
export type UserRole = 'admin' | 'manager' | 'teacher' | 'assistant' | 'cook' | 'cleaner' | 'security' | 'nurse' | 'child' | 'null' | 'doctor' | 'psychologist' | 'intern';

// Middleware для проверки роли пользователя
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      console.log('🔍 Проверка роли пользователя:', user?.role, 'в списке:', roles);
      
      // Проверяем, авторизован ли пользователь
      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return res.status(401).json({ 
          success: false, 
          message: 'Пользователь не авторизован' 
        });
      }
      
      // Проверяем, имеет ли пользователь одну из требуемых ролей
      if (!roles.includes(user.role as UserRole)) {
        console.log('❌ У пользователя нет требуемой роли:', user.role);
        return res.status(403).json({ 
          success: false, 
          message: 'Недостаточно прав для выполнения операции' 
        });
      }
      
      console.log('✅ Пользователь имеет требуемую роль:', user.role);
      next();
    } catch (error) {
      console.error('❌ Ошибка проверки роли:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка проверки роли пользователя' 
      });
    }
  };
};

// Middleware для проверки принадлежности к группе
export const requireGroupMembership = (groupIdParam: string = 'groupId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const groupId = req.params[groupIdParam] || req.body[groupIdParam] || req.query[groupIdParam];
      
      console.log('🔍 Проверка принадлежности к группе:', groupId, 'для пользователя:', user?._id);
      
      // Проверяем, авторизован ли пользователь
      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return res.status(401).json({ 
          success: false, 
          message: 'Пользователь не авторизован' 
        });
      }
      
      // Администраторы имеют доступ ко всем группам
      if (user.role === 'admin') {
        console.log('✅ Администратор имеет доступ ко всем группам');
        return next();
      }
      
      // Проверяем, является ли пользователь воспитателем или помощником воспитателя группы
      const group = await Group.findById(groupId);
      if (!group) {
        console.log('❌ Группа не найдена');
        return res.status(404).json({ 
          success: false, 
          message: 'Группа не найдена' 
        });
      }
      
      // Проверяем, является ли пользователь воспитателем или помощником воспитателя группы
      if (
        (group.teacherId && group.teacherId.toString() === user._id.toString()) ||
        (group.assistantTeacherId && group.assistantTeacherId.toString() === user._id.toString())
      ) {
        console.log('✅ Пользователь является воспитателем или помощником воспитателя группы');
        return next();
      }
      
      console.log('❌ У пользователя нет доступа к группе');
      return res.status(403).json({ 
        success: false, 
        message: 'Недостаточно прав для доступа к группе' 
      });
    } catch (error) {
      console.error('❌ Ошибка проверки принадлежности к группе:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка проверки принадлежности к группе' 
      });
    }
  };
};

// Middleware для проверки принадлежности к ребенку
export const requireChildOwnership = (childIdParam: string = 'childId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const childId = req.params[childIdParam] || req.body[childIdParam] || req.query[childIdParam];
      
      console.log('🔍 Проверка принадлежности к ребенку:', childId, 'для пользователя:', user?._id);
      
      // Проверяем, авторизован ли пользователь
      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return res.status(401).json({ 
          success: false, 
          message: 'Пользователь не авторизован' 
        });
      }
      
      // Администраторы и менеджеры имеют доступ ко всем детям
      if (user.role === 'admin' || user.role === 'manager') {
        console.log('✅ Администратор или менеджер имеет доступ ко всем детям');
        return next();
      }
      
      // Проверяем, является ли пользователь родителем ребенка
      const child = await Child.findById(childId);
      if (!child) {
        console.log('❌ Ребенок не найден');
        return res.status(404).json({ 
          success: false, 
          message: 'Ребенок не найден' 
        });
      }
      
      // Проверяем, является ли пользователь родителем ребенка
      if ((child as any).parentId && (child as any).parentId.toString() === user._id.toString()) {
        console.log('✅ Пользователь является родителем ребенка');
        return next();
      }
      
      // Проверяем, является ли пользователь воспитателем или помощником воспитателя группы ребенка
      if (child.groupId) {
        const group = await Group.findById(child.groupId);
        if (group) {
          if (
            (group.teacherId && group.teacherId.toString() === user._id.toString()) ||
            (group.assistantTeacherId && group.assistantTeacherId.toString() === user._id.toString())
          ) {
            console.log('✅ Пользователь является воспитателем или помощником воспитателя группы ребенка');
            return next();
          }
        }
      }
      
      console.log('❌ У пользователя нет доступа к ребенку');
      return res.status(403).json({ 
        success: false, 
        message: 'Недостаточно прав для доступа к ребенку' 
      });
    } catch (error) {
      console.error('❌ Ошибка проверки принадлежности к ребенку:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка проверки принадлежности к ребенку' 
      });
    }
  };
};

// Middleware для проверки принадлежности к сотруднику
export const requireStaffOwnership = (staffIdParam: string = 'staffId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const staffId = req.params[staffIdParam] || req.body[staffIdParam] || req.query[staffIdParam];
      
      console.log('🔍 Проверка принадлежности к сотруднику:', staffId, 'для пользователя:', user?._id);
      
      // Проверяем, авторизован ли пользователь
      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return res.status(401).json({ 
          success: false, 
          message: 'Пользователь не авторизован' 
        });
      }
      
      // Администраторы и менеджеры имеют доступ ко всем сотрудникам
      if (user.role === 'admin' || user.role === 'manager') {
        console.log('✅ Администратор или менеджер имеет доступ ко всем сотрудникам');
        return next();
      }
      
      // Проверяем, является ли пользователь самим собой (сотрудник просматривает свои данные)
      if (staffId === user._id.toString()) {
        console.log('✅ Сотрудник просматривает свои данные');
        return next();
      }
      
      console.log('❌ У пользователя нет доступа к сотруднику');
      return res.status(403).json({ 
        success: false, 
        message: 'Недостаточно прав для доступа к сотруднику' 
      });
    } catch (error) {
      console.error('❌ Ошибка проверки принадлежности к сотруднику:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка проверки принадлежности к сотруднику' 
      });
    }
  };
};
