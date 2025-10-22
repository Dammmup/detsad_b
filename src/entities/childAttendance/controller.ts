import { Request, Response } from 'express';
import { AuthUser } from '../../middlewares/authMiddleware';
import { ChildAttendanceService } from './service';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const childAttendanceService = new ChildAttendanceService();

export const getAllAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let { groupId, childId, date, startDate, endDate, status } = req.query;
    
    // Проверяем права доступа
    // Пользователь может получать только данные по своей группе, если он не администратор
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для воспитателей и помощников воспитателя разрешаем доступ к посещаемости в их группе
      if (req.user.role === 'teacher' || req.user.role === 'assistant') {
        // Если не указан groupId, устанавливаем его на группу пользователя (если она есть)
        if (!groupId && req.user.groupId) {
          groupId = req.user.groupId;
        }
      } else {
        // Для других ролей ограничиваем доступ
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access attendance data' });
      }
    }
    
    const attendance = await childAttendanceService.getAll(
      { groupId: groupId as string, childId: childId as string, date: date as string, startDate: startDate as string, endDate: endDate as string, status: status as string },
      req.user.id as string,
      req.user.role as string
    );
    
    res.json(attendance);
 } catch (err) {
    console.error('Error fetching child attendance:', err);
    res.status(500).json({ error: 'Ошибка получения посещаемости' });
 }
};

export const createOrUpdateAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const attendance = await childAttendanceService.createOrUpdate(req.body, req.user.id as string);
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error creating/updating attendance:', err);
    res.status(400).json({ error: 'Ошибка сохранения посещаемости' });
  }
};

export const bulkCreateOrUpdateAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { records, groupId } = req.body;
    
    const result = await childAttendanceService.bulkCreateOrUpdate(records, groupId, req.user.id as string);
    res.json(result);
  } catch (err) {
    console.error('Error bulk saving attendance:', err);
    res.status(500).json({ error: 'Ошибка массового сохранения' });
  }
};

export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let { groupId, startDate, endDate } = req.query;
    
    // Проверяем права доступа
    // Пользователь может получать статистику только по своей группе, если он не администратор
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для воспитателей и других ролей, которые работают с детьми,
      // нужно ограничить доступ к статистике только по их группе
      if (!groupId && req.user.role !== 'teacher' && req.user.role !== 'assistant') {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access statistics' });
      }
    }
    
    const stats = await childAttendanceService.getStats(
      { groupId: groupId as string, startDate: startDate as string, endDate: endDate as string }
    );
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting attendance stats:', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};

export const deleteAttendance = async (req: AuthenticatedRequest, res: Response) => {
 try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await childAttendanceService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ error: 'Ошибка удаления записи' });
  }
};

export const debugAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const debugInfo = await childAttendanceService.debug();
    res.json(debugInfo);
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: 'Debug error' });
  }
};