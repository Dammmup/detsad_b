import { Request, Response } from 'express';
import { ReportsService } from './service';
import { PayrollService } from '../payroll/service';
import { AuthUser } from '../../middlewares/authMiddleware';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const reportsService = new ReportsService();
const payrollService = new PayrollService();

export const getAllReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { type, status, generatedById } = req.query;
    
    const reports = await reportsService.getAll({
      type: type as string,
      status: status as string,
      generatedById: generatedById as string
    });
    
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Ошибка получения отчетов' });
  }
};

export const getReportById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const report = await reportsService.getById(req.params.id);
    res.json(report);
  } catch (err: any) {
    console.error('Error fetching report:', err);
    res.status(404).json({ error: err.message || 'Отчет не найден' });
 }
};

export const createReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Добавляем автора из аутентифицированного пользователя
    const reportData = {
      ...req.body,
      generatedBy: req.user.id
    };
    
    const report = await reportsService.create(reportData);
    res.status(201).json(report);
  } catch (err: any) {
    console.error('Error creating report:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания отчета' });
  }
};

export const updateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const report = await reportsService.update(req.params.id, req.body);
    res.json(report);
  } catch (err: any) {
    console.error('Error updating report:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления отчета' });
 }
};

export const deleteReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await reportsService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting report:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления отчета' });
  }
};

export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { data, filters } = req.body;
    
    const report = await reportsService.generateReport(req.params.id, data, filters);
    res.json(report);
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(404).json({ error: err.message || 'Ошибка генерации отчета' });
  }
};

export const sendReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recipients } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Не указаны получатели' });
    }
    
    const report = await reportsService.sendReport(req.params.id, recipients);
    res.json(report);
  } catch (err: any) {
    console.error('Error sending report:', err);
    res.status(404).json({ error: err.message || 'Ошибка отправки отчета' });
  }
};

export const getReportsByType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { type } = req.params;
    const { generatedById } = req.query;
    
    const reports = await reportsService.getReportsByType(type, generatedById as string);
    res.json(reports);
  } catch (err: any) {
    console.error('Error fetching reports by type:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения отчетов по типу' });
  }
};

export const getRecentReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 10;
    
    const reports = await reportsService.getRecentReports(limitNum);
    res.json(reports);
  } catch (err: any) {
    console.error('Error fetching recent reports:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения последних отчетов' });
  }
};

// Контроллер для получения сводки по зарплатам
export const getSalarySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { month, startDate, endDate } = req.query;
    
    // Проверяем наличие параметра month или диапазона дат
    if (!month && (!startDate || !endDate)) {
      return res.status(400).json({ error: 'Не указан параметр month или диапазон дат (startDate и endDate)' });
    }
    
    let summary;
    if (month) {
      // Если указан month, используем его
      summary = await reportsService.getSalarySummary(month as string);
    } else {
      // Если указан диапазон дат, используем его
      summary = await reportsService.getSalarySummaryByDateRange(startDate as string, endDate as string);
    }
    
    res.json(summary);
  } catch (err: any) {
    console.error('Error fetching salary summary:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сводки по зарплатам' });
  }
};

// Контроллер для экспорта отчета по зарплатам
export const exportSalaryReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { startDate, endDate, userId, format, includeDeductions, includeBonus } = req.body;
    
    // Проверяем, что формат указан и поддерживается
    if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат. Поддерживаются: pdf, excel, csv' });
    }
    
    // В реальном приложении здесь будет логика генерации отчета по зарплатам
    // Включая получение данных из соответствующих коллекций
    const payrollData = await payrollService.getAllWithUsers({
      staffId: userId || undefined,
      period: startDate ? `${new Date(startDate).getFullYear()}-${String(new Date(startDate).getMonth() + 1).padStart(2, '0')}` : undefined,
      status: undefined
    });
    
    // Фильтруем данные по диапазону дат, если они предоставлены
    let filteredData = payrollData;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredData = payrollData.filter(item => {
        const itemDate = new Date(item.period ? item.period : item.createdAt);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    // Формируем данные для отчета
    const reportData = {
      startDate,
      endDate,
      period: `${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}`,
      data: filteredData.map(item => ({
        staffName: item.staffId && (item.staffId.fullName || item.staffId.name) || 'Неизвестный сотрудник',
        baseSalary: item.baseSalary || 0,
        bonuses: item.bonuses || 0,
        penalties: item.penalties || 0,
        total: item.total || 0,
        status: item.status || 'N/A',
        period: item.period || 'N/A'
      })),
      summary: {
        totalEmployees: filteredData.length,
        totalBaseSalary: filteredData.reduce((sum, item) => sum + (item.baseSalary || 0), 0),
        totalBonuses: filteredData.reduce((sum, item) => sum + (item.bonuses || 0), 0),
        totalPenalties: filteredData.reduce((sum, item) => sum + (item.penalties || 0), 0),
        totalPayout: filteredData.reduce((sum, item) => sum + (item.total || 0), 0)
      }
    };
    
    // В зависимости от формата, генерируем соответствующий тип файла
    // Для упрощения возвращаем JSON данные, в реальном приложении здесь будет генерация PDF/Excel/CSV файла
    switch (format) {
      case 'pdf':
        // Здесь должна быть логика генерации PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.pdf`);
        // Возвращаем заглушку PDF
        res.send(Buffer.from('PDF заглушка для отчета по зарплатам'));
        break;
      case 'excel':
        // Здесь должна быть логика генерации Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.xlsx`);
        // Возвращаем заглушку Excel
        res.send(Buffer.from('Excel заглушка для отчета по зарплатам'));
        break;
      case 'csv':
        // Генерируем CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.csv`);
        
        // Формируем CSV содержимое
        const csvHeader = 'Сотрудник,Оклад,Премии,Штрафы,Итого,Статус,Период\n';
        const csvContent = reportData.data.map((row: any) =>
          `${row.staffName},${row.baseSalary},${row.bonuses},${row.penalties},${row.total},${row.status},${row.period}`
        ).join('\n');
        
        res.send(csvHeader + csvContent);
        break;
      default:
        res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err: any) {
    console.error('Error exporting salary report:', err);
    res.status(500).json({ error: err.message || 'Ошибка экспорта отчета по зарплатам' });
 }
};