import express, { Request, Response } from 'express';
import Report, { IReport } from '../models/Report';
import User from '../models/Users';
import Group from '../models/Group';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Get all reports with optional filters
router.get('/', async (req: Request, res: Response) => {
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
router.get('/:id', async (req: Request, res: Response) => {
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
router.post('/', async (req: AuthenticatedRequest | Request, res: Response) => {
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
router.put('/:id', async (req: AuthenticatedRequest | Request, res: Response) => {
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
router.delete('/:id', async (req: AuthenticatedRequest | Request, res: Response) => {
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

// Generate attendance statistics
router.get('/statistics/attendance', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Начальная и конечная даты обязательны' });
    }
    
    // Mock statistics for now - in real implementation, this would query TimeEntry model
    const stats = {
      totalDays: 22,
      presentDays: 18,
      lateDays: 2,
      absentDays: 2,
      attendanceRate: 81.8,
      totalWorkHours: 144,
      averageWorkHoursPerDay: 8.0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error generating attendance statistics:', error);
    res.status(500).json({ error: 'Ошибка при генерации статистики посещаемости' });
  }
});

// Generate schedule statistics
router.get('/statistics/schedule', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Начальная и конечная даты обязательны' });
    }
    
    // Mock statistics for now - in real implementation, this would query Schedule model
    const stats = {
      totalShifts: 22,
      regularShifts: 18,
      overtimeShifts: 2,
      cancelledShifts: 2,
      totalScheduledHours: 176,
      totalWorkedHours: 144,
      efficiencyRate: 81.8
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error generating schedule statistics:', error);
    res.status(500).json({ error: 'Ошибка при генерации статистики расписания' });
  }
});

// Export report to file
router.post('/:id/export', async (req: AuthenticatedRequest | Request, res: Response) => {
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
    
    // Mock export functionality - in real implementation, this would generate actual files
    const exportResult = {
      success: true,
      format,
      downloadUrl: `/api/reports/${req.params.id}/download`,
      message: `Отчет успешно экспортирован в формате ${format.toUpperCase()}`
    };
    
    res.json(exportResult);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Ошибка при экспорте отчета' });
  }
});

// Generate custom report
router.post('/generate', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type, startDate, endDate, userId, format, title } = req.body;
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Тип отчета, начальная и конечная даты обязательны' });
    }
    
    // Create new report
    const reportData = {
      title: title || `Отчет по ${type} за ${startDate} - ${endDate}`,
      type,
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      filters: {
        userId: userId || undefined
      },
      format: format || 'pdf',
      status: 'completed',
      data: {}, // Would be populated with actual data
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

// Schedule automatic report generation
router.post('/schedule', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type, scheduledFor, emailRecipients, format, title } = req.body;
    
    if (!type || !scheduledFor) {
      return res.status(400).json({ error: 'Тип отчета и время планирования обязательны' });
    }
    
    const reportData = {
      title: title || `Запланированный отчет по ${type}`,
      type,
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      },
      format: format || 'pdf',
      status: 'scheduled',
      scheduledFor: new Date(scheduledFor),
      emailRecipients: emailRecipients || [],
      createdBy: req.user.id
    };
    
    const report = new Report(reportData);
    await report.save();
    
    res.status(201).json({ 
      message: 'Отчет успешно запланирован',
      report: report
    });
  } catch (error: any) {
    console.error('Error scheduling report:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при планировании отчета' });
  }
});

export default router;
