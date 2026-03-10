import { Request, Response } from 'express';
import { ShiftsService } from './service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { sendTelegramNotificationToRoles } from '../../utils/telegramNotifications';
import User from '../users/model';
import Shift from './model';
import { AuthUser } from '../../middlewares/authMiddleware';
import { logAction } from '../../utils/auditLogger';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const shiftsService = new ShiftsService();
const MANAGING_ROLES = ['admin', 'manager', 'director'];

export const getAllShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let { staffId, date, status, startDate, endDate } = req.query;



    if (!MANAGING_ROLES.includes(req.user.role)) {

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

export const createShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (!MANAGING_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to create shifts' });
    }


    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;

    const processedShiftData = {
      ...shiftData,
      staffId: userId || shiftData.staffId,
      createdBy: req.user.id
    };

    const result = await shiftsService.create(processedShiftData, req.user.id as string);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'create',
      entityType: 'staffShift',
      entityId: result._id?.toString() || '',
      entityName: '',
      details: `Создана смена на ${shiftData.date || ''}`
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error creating shift:', err);
    if (err.name === 'ValidationError') {

      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка создания смены' });
  }
};


export const requestShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }



    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;


    const processedShiftData = {
      ...shiftData,
      staffId: req.user.id,
      status: 'pending_approval',
      createdBy: req.user.id
    };

    const result = await shiftsService.create(processedShiftData, req.user.id as string);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error requesting shift:', err);
    if (err.name === 'ValidationError') {

      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка запроса смены' });
  }
};


export const updateShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (!MANAGING_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update shifts' });
    }


    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, ...shiftData } = req.body;

    const result = await shiftsService.update(req.params.id, shiftData);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'update',
      entityType: 'staffShift',
      entityId: req.params.id,
      entityName: ''
    });

    res.json(result);
  } catch (err) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: 'Ошибка обновления смены' });
  }
};

export const deleteShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete shifts' });
    }

    const result = await shiftsService.delete(req.params.id);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'delete',
      entityType: 'staffShift',
      entityId: req.params.id,
      entityName: ''
    });

    res.json(result);
  } catch (err) {
    console.error('Error deleting shift:', err);
    res.status(400).json({ error: 'Ошибка удаления смены' });
  }
};

export const bulkDeleteShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete shifts' });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid IDs provided' });
    }

    const result = await shiftsService.bulkDelete(ids);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'bulk_update',
      entityType: 'staffShift',
      entityId: ids.join(','),
      entityName: '',
      details: `Массовое удаление ${ids.length} смен`
    });

    res.json(result);
  } catch (err) {
    console.error('Error bulk deleting shifts:', err);
    res.status(500).json({ error: 'Ошибка массового удаления смен' });
  }
};

export const bulkUpdateShiftsStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!MANAGING_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    const { staffId, startDate, endDate, status } = req.body;

    if (!startDate || !endDate || !status) {
      return res.status(400).json({ error: 'Missing required fields: startDate, endDate, status' });
    }

    const result = await shiftsService.bulkUpdateStatus({ staffId, startDate, endDate, status }, req.user.id as string);
    res.json(result);
  } catch (err: any) {
    console.error('Error bulk updating shifts status:', err);
    res.status(500).json({ error: err.message || 'Ошибка массового обновления статусов' });
  }
};

export const checkInSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { shiftId } = req.params;
    const { latitude, longitude, deviceMetadata } = req.body;

    // Расширенное логирование для диагностики
    console.log('📱 checkInSimple - Content-Type:', req.headers['content-type']);
    console.log('📱 checkInSimple - Content-Length:', req.headers['content-length']);
    console.log('📱 checkInSimple - req.body:', JSON.stringify(req.body, null, 2));
    console.log('📱 checkInSimple - deviceMetadata received:', JSON.stringify(deviceMetadata, null, 2));

    const locationData = (latitude != null && longitude != null) ? { latitude, longitude } : undefined;

    // Добавляем IP-адрес клиента к метаданным устройства
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const enrichedDeviceMetadata = deviceMetadata ? {
      ...deviceMetadata,
      ipAddress: clientIp,
    } : undefined;

    console.log('📱 checkInSimple - enrichedDeviceMetadata:', JSON.stringify(enrichedDeviceMetadata, null, 2));

    const result = (await shiftsService.checkIn(shiftId, req.user.id as string, req.user.role as string, locationData, enrichedDeviceMetadata, clientIp)) as any;

    // Telegram notification
    try {
      const user = await User.findById(req.user.id);
      const almatyTimeStr = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' });
      const almatyDateStr = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Almaty' });

      const escapedName = user?.fullName ?
        require('../../utils/telegramLogger').escapeHTML(user.fullName) : 'Сотрудник';

      const message = `👤 <b>${escapedName}</b> отметил <b>ПРИХОД</b> на смену\n🕒 Время: ${almatyDateStr} в ${almatyTimeStr}`;

      await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    } catch (telegramError) {
      console.warn('Telegram log failed (checkInSimple):', telegramError);
    }

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'status_change',
      entityType: 'staffShift',
      entityId: shiftId,
      entityName: req.user!.fullName,
      details: 'Чек-ин'
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error checking in:', err);
    if (err.message && (
      err.message.includes('вне геозоны') ||
      err.message.includes('Координаты не переданы') ||
      err.message.includes('Смена не найдена')
    )) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка отметки прихода' });
  }
};

export const checkOutSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { shiftId } = req.params;
    const { latitude, longitude, deviceMetadata } = req.body;
    const locationData = (latitude != null && longitude != null) ? { latitude, longitude } : undefined;

    // Добавляем IP-адрес клиента к метаданным устройства
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const enrichedDeviceMetadata = deviceMetadata ? {
      ...deviceMetadata,
      ipAddress: clientIp,
    } : undefined;

    const result = (await shiftsService.checkOut(shiftId, req.user.id as string, req.user.role as string, locationData, enrichedDeviceMetadata, clientIp)) as any;

    // Telegram notification
    try {
      const user = await User.findById(req.user.id);
      const almatyTimeStr = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' });
      const almatyDateStr = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Almaty' });

      const escapedName = user?.fullName ?
        require('../../utils/telegramLogger').escapeHTML(user.fullName) : 'Сотрудник';

      const message = `👤 <b>${escapedName}</b> отметил <b>УХОД</b> со смены\n🕒 Время: ${almatyDateStr} в ${almatyTimeStr}`;

      await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    } catch (telegramError) {
      console.warn('Telegram log failed (checkOutSimple):', telegramError);
    }

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'status_change',
      entityType: 'staffShift',
      entityId: shiftId,
      entityName: req.user!.fullName,
      details: 'Чек-аут'
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error checking out:', err);
    if (err.message && (
      err.message.includes('вне геозоны') ||
      err.message.includes('Координаты не переданы') ||
      err.message.includes('Смена не найдена')
    )) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Ошибка отметки ухода' });
  }
};

export const getTimeTrackingSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let { staffId, startDate, endDate } = req.query;



    if (!MANAGING_ROLES.includes(req.user.role)) {
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

export const updateLateShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (!MANAGING_ROLES.includes(req.user.role)) {
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

export const updateAdjustmentsSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (!MANAGING_ROLES.includes(req.user.role)) {
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