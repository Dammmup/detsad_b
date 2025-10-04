import { Document, Types } from 'mongoose';
import Report, { IReport } from './report.model';
import ReportTemplate, { IReportTemplate } from './report-template.model';
import User from '../users/user.model';
import Child from '../children/child.model';
import Group from '../groups/group.model';

// Сервис для работы с отчетами
export class ReportService {
  // === Reports ===
  
  // Получение отчетов с фильтрацией
  async getReports(filter: any = {}) {
    try {
      return await Report.find(filter)
        .populate('templateId', 'name category description')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting reports: ${error}`);
    }
  }

  // Получение отчета по ID
  async getReportById(id: string) {
    try {
      return await Report.findById(id)
        .populate('templateId', 'name category description')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting report by id: ${error}`);
    }
  }

  // Создание нового отчета
  async createReport(reportData: Partial<IReport>) {
    try {
      const report = new Report(reportData);
      return await report.save();
    } catch (error) {
      throw new Error(`Error creating report: ${error}`);
    }
  }

  // Обновление отчета
  async updateReport(id: string, reportData: Partial<IReport>) {
    try {
      return await Report.findByIdAndUpdate(id, reportData, { new: true })
        .populate('templateId', 'name category description')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating report: ${error}`);
    }
  }

  // Удаление отчета
  async deleteReport(id: string) {
    try {
      const result = await Report.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting report: ${error}`);
    }
  }

  // === Report Templates ===
  
  // Получение шаблонов отчетов с фильтрацией
  async getReportTemplates(filter: any = {}) {
    try {
      return await ReportTemplate.find(filter)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting report templates: ${error}`);
    }
  }

  // Получение шаблона отчета по ID
  async getReportTemplateById(id: string) {
    try {
      return await ReportTemplate.findById(id)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting report template by id: ${error}`);
    }
  }

  // Создание нового шаблона отчета
  async createReportTemplate(templateData: Partial<IReportTemplate>) {
    try {
      const template = new ReportTemplate(templateData);
      return await template.save();
    } catch (error) {
      throw new Error(`Error creating report template: ${error}`);
    }
  }

  // Обновление шаблона отчета
  async updateReportTemplate(id: string, templateData: Partial<IReportTemplate>) {
    try {
      return await ReportTemplate.findByIdAndUpdate(id, templateData, { new: true })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating report template: ${error}`);
    }
  }

  // Удаление шаблона отчета
  async deleteReportTemplate(id: string) {
    try {
      const result = await ReportTemplate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting report template: ${error}`);
    }
  }

  // === Report Generation ===
  
  // Генерация отчета из шаблона
  async generateReportFromTemplate(templateId: string, parameters: Record<string, any>, userId: string) {
    try {
      // Получаем шаблон
      const template = await ReportTemplate.findById(templateId);
      if (!template) {
        throw new Error('Шаблон отчета не найден');
      }
      
      // Проверяем обязательные параметры
      const missingParameters = template.parameters
        .filter(p => p.required)
        .map(p => p.name)
        .filter(name => !(name in parameters));
      
      if (missingParameters.length > 0) {
        throw new Error(`Отсутствуют обязательные параметры: ${missingParameters.join(', ')}`);
      }
      
      // Генерируем данные отчета (здесь может быть сложная логика запросов к БД)
      const reportData: Partial<IReport> = {
        templateId: template._id as any,
        name: `${template.name}_${new Date().toISOString().split('T')[0]}`,
        description: template.description,
        parameters,
        format: template.format,
        data: {}, // Здесь будет сгенерированные данные
        fileName: `${template.name}_${new Date().toISOString().split('T')[0]}.${template.format}`,
        filePath: `/reports/${template.name}_${new Date().toISOString().split('T')[0]}.${template.format}`,
        generatedBy: userId as any,
        generatedAt: new Date() as any,
        status: 'pending'
      };
      
      // Создаем отчет
      const report = new Report(reportData);
      return await report.save();
    } catch (error) {
      throw new Error(`Error generating report from template: ${error}`);
    }
  }

  // === Report Execution ===
  
  // Выполнение отчета (генерация реальных данных)
  async executeReport(reportId: string) {
    try {
      const report = await Report.findById(reportId)
        .populate('templateId', 'query parameters');
      
      if (!report) {
        throw new Error('Отчет не найден');
      }
      
      // Здесь должна быть логика выполнения отчета
      // В реальной системе это может включать:
      // 1. Выполнение SQL-запроса или агрегации MongoDB
      // 2. Обработку параметров
      // 3. Формирование данных
      // 4. Сохранение в нужном формате
      
      // Пока просто обновляем статус
      const updated = await Report.findByIdAndUpdate(
        reportId,
        {
          status: 'generated',
          // executedAt: new Date() as any // Поле не существует в модели
        },
        { new: true }
      )
        .populate('templateId', 'name category description')
        .populate('generatedBy', 'fullName role');
      
      return updated;
    } catch (error) {
      throw new Error(`Error executing report: ${error}`);
    }
  }

  // === Report Statistics ===
  
  // Получение статистики отчетов
  async getReportStatistics() {
    try {
      const totalReports = await Report.countDocuments();
      const pendingReports = await Report.countDocuments({ status: 'pending' });
      const generatedReports = await Report.countDocuments({ status: 'generated' });
      const failedReports = await Report.countDocuments({ status: 'failed' });
      const archivedReports = await Report.countDocuments({ status: 'archived' });
      
      const totalTemplates = await ReportTemplate.countDocuments();
      const activeTemplates = await ReportTemplate.countDocuments({ isActive: true });
      const inactiveTemplates = await ReportTemplate.countDocuments({ isActive: false });
      
      return {
        reports: {
          total: totalReports,
          pending: pendingReports,
          generated: generatedReports,
          failed: failedReports,
          archived: archivedReports
        },
        templates: {
          total: totalTemplates,
          active: activeTemplates,
          inactive: inactiveTemplates
        }
      };
    } catch (error) {
      throw new Error(`Error getting report statistics: ${error}`);
    }
  }

  // === Report Search ===
  
  // Поиск отчетов по названию
  async searchReportsByName(searchTerm: string) {
    try {
      return await Report.find({
        name: { $regex: searchTerm, $options: 'i' }
      })
        .populate('templateId', 'name category description')
        .populate('generatedBy', 'fullName role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching reports by name: ${error}`);
    }
  }

  // Поиск шаблонов отчетов по названию
  async searchReportTemplatesByName(searchTerm: string) {
    try {
      return await ReportTemplate.find({
        name: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching report templates by name: ${error}`);
    }
  }

  // === Salary Reports ===
  
  // Получение отчетов по зарплате
  async getSalaryReports(filter: any = {}) {
    try {
      // Получаем всех сотрудников с зарплатой
      const users = await User.find({
        role: { $in: ['admin', 'manager', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse', 'doctor', 'psychologist', 'intern'] },
        active: true,
        ...(filter.staffId && { _id: filter.staffId })
      }).select('fullName role salary salaryType shiftRate totalFines createdAt');

      // Фильтруем по месяцу и году если указаны
      let filteredUsers = users;
      if (filter.month || filter.year) {
        const targetDate = new Date();
        if (filter.year) targetDate.setFullYear(parseInt(filter.year as string));
        if (filter.month) targetDate.setMonth(parseInt(filter.month as string) - 1);
        
        filteredUsers = users.filter(user => {
          const userDate = new Date(user.createdAt as any);
          return userDate.getFullYear() === targetDate.getFullYear() && 
                 userDate.getMonth() === targetDate.getMonth();
        });
      }

      // Формируем отчет по зарплате
      const salaryReports = filteredUsers.map(user => ({
        staffId: user._id,
        fullName: user.fullName,
        role: user.role,
        salary: user.salary || 0,
        salaryType: user.salaryType || 'per_month',
        shiftRate: user.shiftRate || 0,
        totalFines: user.totalFines || 0,
        netSalary: (user.salary || 0) - (user.totalFines || 0),
        createdAt: user.createdAt
      }));

      return salaryReports;
    } catch (error) {
      throw new Error(`Error getting salary reports: ${error}`);
    }
  }

  // === Report Cleanup ===
  
  // Удаление устаревших отчетов
  async cleanupExpiredReports() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Удаляем отчеты старше 90 дней
      
      const result = await Report.deleteMany({
        generatedAt: { $lt: cutoffDate },
        status: { $in: ['generated', 'archived'] }
      });
      
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Error cleaning up expired reports: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const reportService = new ReportService();