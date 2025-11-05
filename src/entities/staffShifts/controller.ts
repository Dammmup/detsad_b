import { Request, Response } from 'express';
import { ShiftsService } from './service';

const shiftsService = new ShiftsService();

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let { staffId, date, status, startDate, endDate } = req.query;
    
    // Проверяем права доступа
    // Пользователь может получать только свои смены, если он не администратор
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для обычных пользователей принудительно устанавливаем staffId на их собственный ID
      staffId = req.user.id;
    }
    
    const shifts = await shiftsService.getAll(
      { staffId: staffId as string, date: date as string, status: status as string, startDate: startDate as string, endDate: endDate as string },
      req.user.id as string,
      req.user.role as string
    );
    
    res.json(shifts);
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ error: 'Ошибка получения смен' });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут создавать смены
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to create shifts' });
    }
    
    // Преобразуем данные для корректного формата перед передачей в сервис
    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;
    
    const processedShiftData = {
      ...shiftData,
      staffId: userId || shiftData.staffId, // Поддерживаем оба варианта
      createdBy: req.user.id
    };
    
    const result = await shiftsService.create(processedShiftData, req.user.id as string);
    res.status(201).json(result);
 } catch (err: any) {
    console.error('Error creating shift:', err);
    if (err.name === 'ValidationError') {
      // Return specific validation error details
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка создания смены' });
  }
};

// Метод для создания смены сотрудником с последующим одобрением
export const requestShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Любой сотрудник может запросить дополнительную смену
    // Преобразуем данные для корректного формата перед передачей в сервис
    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;
    
    // Убедимся, что сотрудник создает смену для себя
    const processedShiftData = {
      ...shiftData,
      staffId: req.user.id, // Сотрудник может создать смену только для себя
      status: 'pending_approval', // Всегда устанавливаем статус запроса
      createdBy: req.user.id
    };
    
    const result = await shiftsService.create(processedShiftData, req.user.id as string);
    res.status(201).json(result);
 } catch (err: any) {
    console.error('Error requesting shift:', err);
    if (err.name === 'ValidationError') {
      // Return specific validation error details
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка запроса смены' });
  }
};


export const updateShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут обновлять смены
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update shifts' });
    }
    
    // Удаляем поля, которые больше не существуют в модели смены
    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, ...shiftData } = req.body;
    
    const result = await shiftsService.update(req.params.id, shiftData);
    res.json(result);
  } catch (err) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: 'Ошибка обновления смены' });
 }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут удалять смены
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete shifts' });
    }
    
    const result = await shiftsService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting shift:', err);
    res.status(400).json({ error: 'Ошибка удаления смены' });
  }
};

export const checkInSimple = async (req: Request, res: Response) => {
   try {
     if (!req.user) {
       return res.status(401).json({ error: 'Authentication required' });
     }
     
     const { shiftId } = req.params;
     const { latitude, longitude } = req.body;
     
     // Передаем координаты в сервис, если они предоставлены
     const locationData = latitude && longitude ? { latitude, longitude } : undefined;
     
     const result = await shiftsService.checkIn(shiftId, req.user.id as string, req.user.role as string, locationData);
     res.json(result);
   } catch (err) {
     console.error('Error checking in:', err);
     res.status(500).json({ error: 'Ошибка отметки прихода' });
   }
 };

export const checkOutSimple = async (req: Request, res: Response) => {
   try {
     if (!req.user) {
       return res.status(401).json({ error: 'Authentication required' });
     }
     
     const { shiftId } = req.params;
     const { latitude, longitude } = req.body;
     
     // Передаем координаты в сервис, если они предоставлены
     const locationData = latitude && longitude ? { latitude, longitude } : undefined;
     
     const result = await shiftsService.checkOut(shiftId, req.user.id as string, req.user.role as string, locationData);
     res.json(result);
   } catch (err) {
     console.error('Error checking out:', err);
     res.status(500).json({ error: 'Ошибка отметки ухода' });
   }
 };

export const getTimeTrackingSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let { staffId, startDate, endDate } = req.query;
    
    // Проверяем права доступа
    // Пользователь может получать только свои данные, если он не администратор
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для обычных пользователей принудительно устанавливаем staffId на их собственный ID
      staffId = req.user.id;
    }
    
    const records = await shiftsService.getTimeTrackingRecords(
      { staffId: staffId as string, startDate: startDate as string, endDate: endDate as string },
      req.user.id as string,
      req.user.role as string
    );
    
    res.json(records);
  } catch (err) {
    console.error('Error fetching time tracking:', err);
    res.status(500).json({ error: 'Ошибка получения учета времени' });
  }
};

export const updateLateShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы могут запускать процесс обновления статусов
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update late shifts' });
    }
    
    const shiftsService = new ShiftsService();
    const results = await shiftsService.updateLateShifts();
    
    res.json({
      message: `Обновлено ${results.length} смен с опоздавшими сотрудниками`,
      results
    });
  } catch (err) {
    console.error('Error updating late shifts:', err);
    res.status(500).json({ error: 'Ошибка обновления статусов опоздавших смен' });
  }
};

export const updateAdjustmentsSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут обновлять корректировки
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update adjustments' });
    }
    
    const { penalties, bonuses, notes } = req.body;
    
    const record = await shiftsService.updateAdjustments(
      req.params.id,
      penalties,
      bonuses,
      notes,
      req.user.id as string
    );
    
    res.json(record);
  } catch (err) {
    console.error('Error updating adjustments:', err);
    res.status(400).json({ error: 'Ошибка обновления корректировок' });
  }
};