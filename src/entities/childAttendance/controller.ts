import { Request, Response } from 'express';
import { ChildAttendanceService } from './service';

const childAttendanceService = new ChildAttendanceService();

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId, childId, date, startDate, endDate, status } = req.query;
    
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

export const createOrUpdateAttendance = async (req: Request, res: Response) => {
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

export const bulkCreateOrUpdateAttendance = async (req: Request, res: Response) => {
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

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId, startDate, endDate } = req.query;
    
    const stats = await childAttendanceService.getStats(
      { groupId: groupId as string, startDate: startDate as string, endDate: endDate as string }
    );
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting attendance stats:', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
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

export const debugAttendance = async (req: Request, res: Response) => {
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