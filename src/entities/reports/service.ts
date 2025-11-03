import createReportModel from './model';
import { IReport } from './model';
import { PayrollService } from '../payroll/service';

// Отложенное создание модели
let ReportModel: any = null;

const getReportModel = () => {
  if (!ReportModel) {
    ReportModel = createReportModel();
  }
  return ReportModel;
};

export class ReportsService {
  async getAll(filters: { type?: string, status?: string, generatedById?: string }) {
    const filter: any = {};
    
    if (filters.type) filter.type = filters.type;
    if (filters.status) filter.status = filters.status;
    if (filters.generatedById) filter.generatedBy = filters.generatedById;
    
    const reports = await getReportModel().find(filter)
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 });

    return reports;
 }

  async getById(id: string) {
    const report = await getReportModel().findById(id)
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
    
    const report = new (getReportModel())(reportData);
    await report.save();

    const populatedReport = await getReportModel().findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async update(id: string, data: Partial<IReport>) {
    const updatedReport = await getReportModel().findByIdAndUpdate(
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
    const result = await getReportModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Отчет не найден');
    }
    
    return { message: 'Отчет успешно удален' };
  }

  async generateReport(id: string, data: any, filters: any) {
    const report = await getReportModel().findById(id);
    
    if (!report) {
      throw new Error('Отчет не найден');
    }
    
    // Обновляем данные отчета
    report.data = data;
    report.filters = filters;
    report.generatedAt = new Date();
    report.status = 'generated';
    
    await report.save();
    
    const populatedReport = await getReportModel().findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async sendReport(id: string, recipients: string[]) {
    const report = await getReportModel().findById(id);
    
    if (!report) {
      throw new Error('Отчет не найден');
    }
    
    // Обновляем статус и получателей
    report.recipients = recipients;
    report.sentAt = new Date();
    report.status = 'sent';
    
    await report.save();
    
    const populatedReport = await getReportModel().findById(report._id)
      .populate('generatedBy', 'fullName role');
    
    return populatedReport;
  }

  async getReportsByType(type: string, generatedById?: string) {
    const filter: any = { type };
    
    if (generatedById) {
      filter.generatedBy = generatedById;
    }
    
    const reports = await getReportModel().find(filter)
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 });
    
    return reports;
  }

  async getRecentReports(limit: number = 10) {
    const reports = await getReportModel().find({})
      .populate('generatedBy', 'fullName role')
      .sort({ generatedAt: -1 })
      .limit(limit);
    
    return reports;
  }
  

  
  // Метод для получения сводки по зарплатам
  async getSalarySummary(month: string, userId?: string) {
    const payrollService = new PayrollService();
    
    // Получаем все зарплаты за указанный месяц
    const payrolls = await payrollService.getAllWithUsers({
      period: month,
      status: undefined
    });
    
    // Формируем сводку, исключая записи с null staffId
    const validPayrolls = payrolls.filter(p => p.staffId !== null);
    
    // Если указан userId, фильтруем только по этому пользователю
    const userFilteredPayrolls = userId
      ? validPayrolls.filter(item =>
          item.staffId &&
          (item.staffId._id && item.staffId._id.toString() === userId)
        )
      : validPayrolls;
    
    const summary = {
      totalEmployees: userFilteredPayrolls.length,
      totalAccruals: userFilteredPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0),
      totalPenalties: userFilteredPayrolls.reduce((sum, p) => sum + (p.penalties || 0), 0),
      totalPayout: userFilteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0),
      averageSalary: userFilteredPayrolls.length > 0
        ? userFilteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0) / userFilteredPayrolls.length
        : 0
    };
    
    return summary;
  }
  
  // Метод для получения сводки по зарплатам по диапазону дат
  async getSalarySummaryByDateRange(startDate: string, endDate: string, userId?: string) {
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
    
    // Если указан userId, фильтруем только по этому пользователю
    const userFilteredPayrolls = userId
      ? filteredPayrolls.filter(item =>
          item.staffId &&
          (item.staffId._id && item.staffId._id.toString() === userId)
        )
      : filteredPayrolls;
    
    // Формируем сводку
    const summary = {
      totalEmployees: userFilteredPayrolls.length,
      totalAccruals: userFilteredPayrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0),
      totalPenalties: userFilteredPayrolls.reduce((sum, p) => sum + (p.penalties || 0), 0),
      totalPayout: userFilteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0),
      averageSalary: userFilteredPayrolls.length > 0
        ? userFilteredPayrolls.reduce((sum, p) => sum + (p.total || 0), 0) / userFilteredPayrolls.length
        : 0
    };
    
    return summary;
  }
  
  // Метод для получения сводки по детям
  async getChildrenSummary(groupId?: string) {
    const filter: any = { active: true };
    if (groupId) {
      filter.groupId = groupId;
    }
    
    const children = await (await import('../children/model')).default().find(filter)
      .populate('groupId', 'name');
    
    const summary = {
      totalChildren: children.length,
      byGroup: children.reduce((acc, child) => {
        const groupName = (child.groupId as any)?.name || 'Не указана';
        acc[groupName] = (acc[groupName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      ageDistribution: children.reduce((acc, child) => {
        if (child.birthday) {
          const age = Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 1000));
          const ageGroup = age < 3 ? '0-3' : age < 6 ? '3-6' : '6+';
          acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number })
    };
    
    return summary;
  }
  
  // Метод для получения сводки по посещаемости
  async getAttendanceSummary(startDate: string, endDate: string, groupId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filter: any = {
      date: { $gte: start, $lte: end }
    };
    
    if (groupId) {
      filter.groupId = groupId;
    }
    
    const attendanceRecords = await (await import('../childAttendance/model')).default().find(filter)
      .populate('childId', 'fullName')
      .populate('groupId', 'name');
    
    // Группируем посещаемость по статусам
    const statusCounts = attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Рассчитываем среднюю посещаемость
    const childrenIds = [...new Set(attendanceRecords.map(r => (r.childId as any)._id.toString()))];
    const totalPossibleAttendances = childrenIds.length * (Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 24)));
    const totalPresentAttendances = statusCounts.present || 0;
    const attendanceRate = totalPossibleAttendances > 0
      ? Math.round((totalPresentAttendances / totalPossibleAttendances) * 100)
      : 0;
    
    const summary = {
      totalRecords: attendanceRecords.length,
      attendanceRate,
      byStatus: statusCounts,
      byGroup: attendanceRecords.reduce((acc, record) => {
        const groupName = (record.groupId as any)?.name || 'Не указана';
        acc[groupName] = (acc[groupName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
    
    return summary;
  }
}