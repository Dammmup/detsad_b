import Report from './model';
import { IReport } from './model';
import { PayrollService } from '../payroll/service';

export class ReportsService {
  async getAll(filters: { type?: string, status?: string, generatedById?: string }) {
    const filter: any = {};
    
    if (filters.type) filter.type = filters.type;
    if (filters.status) filter.status = filters.status;
    if (filters.generatedById) filter.generatedBy = filters.generatedById;
    
    const reports = await Report.find(filter)
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 });
    
    return reports;
  }

  async getById(id: string) {
    const report = await Report.findById(id)
      .populate('generatedBy', 'fullName role');
    
    if (!report) {
      throw new Error('Отчет не найден');
    }
    
    return report;
  }

  async create(reportData: Partial<IReport>) {
    // Проверяем обязательные поля
    if (!reportData.title) {
      throw new Error('Не указано название отчета');
    }
    if (!reportData.type) {
      throw new Error('Не указан тип отчета');
    }
    if (!reportData.generatedBy) {
      throw new Error('Не указан автор отчета');
    }
    
    const report = new Report(reportData);
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async update(id: string, data: Partial<IReport>) {
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('generatedBy', 'fullName role');
    
    if (!updatedReport) {
      throw new Error('Отчет не найден');
    }
    
    return updatedReport;
  }

  async delete(id: string) {
    const result = await Report.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Отчет не найден');
    }
    
    return { message: 'Отчет успешно удален' };
  }

  async generateReport(id: string, data: any, filters: any) {
    const report = await Report.findById(id);
    
    if (!report) {
      throw new Error('Отчет не найден');
    }
    
    // Обновляем данные отчета
    report.data = data;
    report.filters = filters;
    report.generatedAt = new Date();
    report.status = 'generated';
    
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async sendReport(id: string, recipients: string[]) {
    const report = await Report.findById(id);
    
    if (!report) {
      throw new Error('Отчет не найден');
    }
    
    // Обновляем статус и получателей
    report.recipients = recipients;
    report.sentAt = new Date();
    report.status = 'sent';
    
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async getReportsByType(type: string, generatedById?: string) {
    const filter: any = { type };
    
    if (generatedById) {
      filter.generatedBy = generatedById;
    }
    
    const reports = await Report.find(filter)
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 });
    
    return reports;
  }

  async getRecentReports(limit: number = 10) {
    const reports = await Report.find({})
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 })
      .limit(limit);
    
    return reports;
 }
  
  // Метод для получения сводки по зарплатам
  async getSalarySummary(month: string) {
    const payrollService = new PayrollService();
    
    // Получаем все зарплаты за указанный месяц
    const payrolls = await payrollService.getAllWithUsers({
      period: month,
      status: undefined
    });
    
    // Формируем сводку, исключая записи с null staffId
    const validPayrolls = payrolls.filter(p => p.staffId !== null);
    
    const summary = {
      totalEmployees: validPayrolls.length,
      totalAccruals: validPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0),
      totalPenalties: validPayrolls.reduce((sum, p) => sum + (p.penalties || 0), 0),
      totalPayout: validPayrolls.reduce((sum, p) => sum + (p.total || 0), 0),
      averageSalary: validPayrolls.length > 0
        ? validPayrolls.reduce((sum, p) => sum + (p.total || 0), 0) / validPayrolls.length
        : 0
    };
    
    return summary;
  }
  
  // Метод для получения сводки по зарплатам по диапазону дат
  async getSalarySummaryByDateRange(startDate: string, endDate: string) {
    const payrollService = new PayrollService();
    
    // Получаем все зарплаты за указанный период
    const payrolls = await payrollService.getAllWithUsers({
      period: undefined,
      status: undefined
    });
    
    // Фильтруем данные по диапазону дат, исключая записи с null staffId
    const start = new Date(startDate);
    const end = new Date(endDate);
    const validPayrolls = payrolls.filter(p => p.staffId !== null);
    const filteredPayrolls = validPayrolls.filter(item => {
      const itemDate = new Date(item.period ? item.period : item.createdAt);
      return itemDate >= start && itemDate <= end;
    });
    
    // Формируем сводку
    const summary = {
      totalEmployees: filteredPayrolls.length,
      totalAccruals: filteredPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0),
      totalPenalties: filteredPayrolls.reduce((sum, p) => sum + (p.penalties || 0), 0),
      totalPayout: filteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0),
      averageSalary: filteredPayrolls.length > 0
        ? filteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0) / filteredPayrolls.length
        : 0
    };
    
    return summary;
  }
}