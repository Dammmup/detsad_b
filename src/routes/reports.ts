import express, { Request, Response } from 'express';
import Report, { IReport } from '../models/Report';
import User from '../models/Users';
import Group from '../models/Group';
import StaffAttendance from '../models/StaffShift';
import { AuthenticatedRequest } from '../types/express';
import Payroll from '../models/Payroll';
import { createObjectCsvStringifier } from 'csv-writer';
import ExcelJS from 'exceljs';

import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes except public statistics
// We'll apply auth middleware selectively to each route instead

// Generate attendance statistics
router.get('/attendance-statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query as any;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Начальная и конечная даты обязательны' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const filter: any = { date: { $gte: start, $lte: end } };
    if (userId) filter.staffId = userId;

    const records = await StaffAttendance.find(filter).lean();

    const uniqueDays = new Set(records.map(r => new Date(r.date).toDateString()));
    const totalDays = uniqueDays.size;
    const presentDays = new Set(records
      .filter(r => ['in_progress','completed'].includes(r.status))
      .map(r => new Date(r.date).toDateString())
    ).size;
    const lateDays = records.filter(r => (r.lateMinutes || 0) > 0).length;
    const absentDays = records.filter(r => r.status === 'no_show').length;
    const earlyLeaveDays = records.filter(r => (r.earlyLeaveMinutes || 0) > 0).length;
    const sickDays = records.filter((r: any) => r.shiftType === 'sick_leave').length;
    const vacationDays = records.filter((r: any) => r.shiftType === 'vacation').length;

    const toMinutes = (hhmm?: string) => {
      if (!hhmm) return 0;
      const [h, m] = hhmm.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const totalWorkMinutes = records.reduce((sum, r: any) => {
      if (!r.actualStart || !r.actualEnd) return sum;
      const startM = toMinutes(r.actualStart);
      const endM = toMinutes(r.actualEnd);
      const breakM = r.breakTime || 0;
      return sum + Math.max(0, endM - startM - breakM);
    }, 0);

    const totalWorkHours = Math.round((totalWorkMinutes / 60) * 10) / 10;
    const attendanceRate = totalDays ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;
    const punctualityRate = totalDays ? Math.round(((presentDays - (lateDays > 0 ? 1 : 0)) / totalDays) * 1000) / 10 : 0;
    const averageWorkHoursPerDay = totalDays ? Math.round((totalWorkHours / totalDays) * 10) / 10 : 0;

    res.json({
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      earlyLeaveDays,
      sickDays,
      vacationDays,
      totalWorkHours,
      attendanceRate,
      punctualityRate,
      averageWorkHoursPerDay
    });
  } catch (error) {
    console.error('Error generating attendance statistics:', error);
    res.status(500).json({ error: 'Ошибка при генерации статистики посещаемости' });
  }
});

// Generate schedule statistics
router.get('/schedule-statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query as any;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Начальная и конечная даты обязательны' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const filter: any = { date: { $gte: start, $lte: end } };
    if (userId) filter.staffId = userId;

    const records = await StaffAttendance.find(filter).lean();

    const toMinutes = (hhmm?: string) => {
      if (!hhmm) return 0;
      const [h, m] = hhmm.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const totalShifts = records.length;
    const regularShifts = records.filter((r: any) => r.shiftType === 'full').length;
    const overtimeShifts = records.filter((r: any) => r.shiftType === 'overtime' || (r.overtimeMinutes || 0) > 0).length;
    const cancelledShifts = records.filter((r: any) => r.status === 'cancelled').length;

    const totalScheduledMinutes = records.reduce((sum, r: any) => {
      return sum + Math.max(0, toMinutes(r.endTime) - toMinutes(r.startTime));
    }, 0);

    const totalWorkedMinutes = records.reduce((sum, r: any) => {
      if (!r.actualStart || !r.actualEnd) return sum;
      const startM = toMinutes(r.actualStart);
      const endM = toMinutes(r.actualEnd);
      const breakM = r.breakTime || 0;
      return sum + Math.max(0, endM - startM - breakM);
    }, 0);

    const sickLeaves = records.filter((r: any) => r.shiftType === 'sick_leave').length;
    const vacationDays = records.filter((r: any) => r.shiftType === 'vacation').length;
    const overtimeHours = Math.round(((records.reduce((s, r: any) => s + (r.overtimeMinutes || 0), 0) / 60) * 10)) / 10;

    const totalScheduledHours = Math.round((totalScheduledMinutes / 60) * 10) / 10;
    const totalWorkedHours = Math.round((totalWorkedMinutes / 60) * 10) / 10;
    const efficiencyRate = totalScheduledMinutes ? Math.round(((totalWorkedMinutes / totalScheduledMinutes) * 1000)) / 10 : 0;

    const uniqueDays = new Set(records.map(r => new Date(r.date).toDateString()));
    const averageHoursPerDay = uniqueDays.size ? Math.round(((totalWorkedHours / uniqueDays.size) * 10)) / 10 : 0;

    res.json({
      totalShifts,
      regularShifts,
      overtimeShifts,
      cancelledShifts,
      totalScheduledHours,
      totalWorkedHours,
      efficiencyRate,
      sickLeaves,
      vacationDays,
      totalHours: totalScheduledHours,
      overtimeHours,
      averageHoursPerDay
    });
  } catch (error) {
    console.error('Error generating schedule statistics:', error);
    res.status(500).json({ error: 'Ошибка при генерации статистики расписания' });
  }
});

// Salary summary analytics
router.get('/salary/summary', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, userId } = req.query as any;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Дата начала и окончания обязательны' });
    }

    // Payroll.month хранится как YYYY-MM, поэтому нормализуем границы
    const startMonth = String(startDate).slice(0, 7);
    const endMonth = String(endDate).slice(0, 7);

    const filter: any = {};
    if (userId) filter.staffId = userId;
    filter.month = { $gte: startMonth, $lte: endMonth };

    const payrolls = await Payroll.find(filter).populate({ path: 'staffId', select: 'fullName', model: 'users' });

    const totalEmployees = new Set(payrolls.map(p => String(p.staffId))).size;
    const totalAccruals = payrolls.reduce((s, p) => s + (p.accruals || 0), 0);
    const totalBonuses = payrolls.reduce((s, p: any) => s + (p.bonuses || 0), 0);
    const totalPenalties = payrolls.reduce((s, p) => s + (p.penalties || 0), 0);
    const totalPayout = payrolls.reduce((s, p) => s + (p.total || 0), 0);

    // Top penalized employees
    const penaltiesByUser: Record<string, { staffName: string; penalties: number }> = {};
    payrolls.forEach(p => {
      const key = String(p.staffId);
      const name = (p.staffId as any)?.fullName || 'Неизвестно';
      penaltiesByUser[key] = penaltiesByUser[key] || { staffName: name, penalties: 0 };
      penaltiesByUser[key].penalties += p.penalties || 0;
    });

    const topPenalized = Object.values(penaltiesByUser)
      .sort((a, b) => b.penalties - a.penalties)
      .slice(0, 5);

    res.json({
      totalEmployees,
      totalAccruals,
      totalBonuses,
      totalPenalties,
      totalPayout,
      avgPenaltyPerEmployee: totalEmployees ? Math.round((totalPenalties / totalEmployees) * 100) / 100 : 0,
      topPenalized,
      count: payrolls.length
    });
  } catch (error) {
    console.error('Error generating salary summary:', error);
    res.status(500).json({ error: 'Ошибка при генерации сводки по зарплатам' });
  }
});

// Get all reports with optional filters
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, status, startDate, endDate, userId } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (userId) filter.createdBy = userId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    const reports = await Report.find(filter)
      .populate('createdBy', 'fullName role')
      .populate('filters.userId', 'fullName role')
      .populate('filters.groupId', 'name description')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Ошибка при получении отчетов' });
  }
});

// Get a single report by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'fullName role')
      .populate('filters.userId', 'fullName role')
      .populate('filters.groupId', 'name description');
    
    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Ошибка при получении отчета' });
  }
});

// Create a new report
router.post('/', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const reportData = {
      ...req.body,
      createdBy: req.user.id
    };

    const report = new Report(reportData);
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('createdBy', 'fullName role')
      .populate('filters.userId', 'fullName role')
      .populate('filters.groupId', 'name description');
    
    res.status(201).json(populatedReport);
  } catch (error: any) {
    console.error('Error creating report:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при создании отчета' });
  }
});

// Update an existing report
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'fullName role')
      .populate('filters.userId', 'fullName role')
      .populate('filters.groupId', 'name description');
    
    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }
    
    res.json(report);
  } catch (error: any) {
    console.error('Error updating report:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении отчета' });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }
    
    res.json({ message: 'Отчет успешно удален' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Ошибка при удалении отчета' });
  }
});


// Export report to file
router.post('/:id/export', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { format } = req.body;
    
    if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат файла' });
    }
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }
    
    // Моковая логика экспорта - в реальном приложении здесь будет генерация файла
    const exportResult = {
      success: true,
      format,
      downloadUrl: `/reports/${req.params.id}/download`,
      message: `Отчет успешно экспортирован в формате ${format.toUpperCase()}`
    };
    
    res.json(exportResult);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Ошибка при экспорте отчета' });
  }
});

// Export salary report
router.post('/salary/export', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    console.log('[salary/export] req.user:', req.user);
    console.log('[salary/export] req.body:', req.body);
    const { startDate, endDate, userId, format } = req.body as any;
    if (!req.user) {
      console.error('[salary/export] Нет пользователя!');
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!startDate || !endDate) {
      console.error('[salary/export] Нет дат:', { startDate, endDate });
      return res.status(400).json({ error: 'Дата начала и окончания обязательны' });
    }
    if (!format) {
      console.error('[salary/export] Нет формата:', { format });
      return res.status(400).json({ error: 'Формат файла обязателен (csv, excel, json)'});
    }
    const filter: any = {};
    if (userId) filter.staffId = userId;
    if (startDate && endDate) {
      filter.month = { $gte: startDate, $lte: endDate };
    }
    console.log('[salary/export] filter:', filter);
    const payrolls = await Payroll.find(filter).populate('staffId', 'fullName role email');
    if (format === 'csv') {
      const csvWriter = createObjectCsvStringifier({
        header: [
          { id: 'staffName', title: 'Сотрудник' },
          { id: 'month', title: 'Месяц' },
          { id: 'accruals', title: 'Начисления' },
          { id: 'penalties', title: 'Штрафы' },
          { id: 'total', title: 'Итого' }
        ]
      });
      const records = payrolls.map(p => ({
        staffName: (p.staffId as any)?.fullName || 'Неизвестно',
        month: p.month,
        accruals: p.accruals,
        bonuses: (p as any).bonuses || 0,
        penalties: p.penalties,
        total: p.total
      }));
      const csvContent = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
      res.header('Content-Type', 'text/csv');
      res.attachment('salary_report.csv');
      return res.send(csvContent);
    }
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Отчет по зарплатам');
      worksheet.columns = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Месяц', key: 'month', width: 15 },
        { header: 'Начисления', key: 'accruals', width: 15 },
        { header: 'Штрафы', key: 'penalties', width: 15 },
        { header: 'Итого', key: 'total', width: 15 }
      ];
      payrolls.forEach(p => {
        worksheet.addRow({
          staffName: (p.staffId as any)?.fullName || 'Неизвестно',
          month: p.month,
          accruals: p.accruals,
          bonuses: (p as any).bonuses || 0,
          penalties: p.penalties,
          total: p.total
        });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="salary_report.xlsx"');
      const buffer = await workbook.xlsx.writeBuffer();
      return res.send(Buffer.from(buffer));
    }
    // default JSON
    return res.json({ success: true, data: payrolls });
  } catch (error) {
    console.error('Error exporting salary report:', error);
    res.status(500).json({ error: 'Ошибка при экспорте отчета по зарплатам' });
  }
});

// Export children report
router.post('/children/export', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { groupId, format, includeParentInfo, includeHealthInfo } = req.body;
    
    // В реальном приложении здесь будет генерация отчета по детям
    // Это моковая реализация
    const mockBlob = new Blob(['Mock children report data'], { type: 'application/pdf' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="children_report.pdf"');
    res.send(mockBlob);
    
  } catch (error) {
    console.error('Error exporting children report:', error);
    res.status(500).json({ error: 'Ошибка при экспорте отчета по детям' });
  }
});

// Export attendance report
router.post('/attendance/export', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, userId, format, includeStatistics, includeCharts } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Дата начала и окончания обязательны' });
    }
    
    // В реальном приложении здесь будет генерация отчета по посещаемости
    // Это моковая реализация
    const mockBlob = new Blob(['Mock attendance report data'], { type: 'application/pdf' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.pdf"');
    res.send(mockBlob);
    
  } catch (error) {
    console.error('Error exporting attendance report:', error);
    res.status(500).json({ error: 'Ошибка при экспорте отчета по посещаемости' });
  }
});

// Send report via email
router.post('/send-email', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { reportType, recipients, subject, message, format, reportParams } = req.body;
    
    if (!recipients || !recipients.length) {
      return res.status(400).json({ error: 'Необходимо указать получателей' });
    }
    
    // В реальном приложении здесь будет отправка email
    // Это моковая реализация
    const result = {
      success: true,
      message: 'Отчет успешно отправлен на почту',
      recipients: recipients.length,
      format: format
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Error sending report by email:', error);
    res.status(500).json({ error: 'Ошибка при отправке отчета на почту' });
  }
});

// Schedule automatic report generation and sending
router.post('/schedule', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { reportType, frequency, recipients, format, reportParams } = req.body;
    
    if (!reportType || !frequency || !recipients || !format) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }
    
    // В реальном приложении здесь будет создание задачи для планировщика
    // Это моковая реализация
    const result = {
      success: true,
      message: 'Отчет успешно запланирован',
      reportType,
      frequency,
      recipients: recipients.length
    };
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ error: 'Ошибка при планировании отчета' });
  }
});

// Download report file directly
router.get('/:id/download', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Отчет не найден' });
    }
    
    // В реальном приложении здесь будет скачивание файла
    // Это моковая реализация
    const mockBlob = new Blob(['Mock report file'], { type: 'application/pdf' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${req.params.id}.pdf"`);
    res.send(mockBlob);
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Ошибка при скачивании отчета' });
  }
});

// Generate a custom report
router.post('/generate', authMiddleware, async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type, startDate, endDate, userId, format } = req.body;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Тип отчета, начальная и конечная даты обязательны' });
    }
    
    // Создаем отчет
    const reportData = {
      title: `Отчет по ${type} за ${startDate} - ${endDate}`,
      type,
      dateRange: {
        startDate,
        endDate
      },
      filters: {
        userId: userId || undefined
      },
      format: format || 'pdf',
      status: 'completed',
      data: {}, // Данные отчета будут здесь
      createdBy: req.user.id
    };
    
    const report = new Report(reportData);
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('createdBy', 'fullName role')
      .populate('filters.userId', 'fullName role');
    
    res.status(201).json(populatedReport);
  } catch (error: any) {
    console.error('Error generating custom report:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при генерации отчета' });
  }
});

export default router;
