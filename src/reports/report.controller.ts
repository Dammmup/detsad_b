import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';

export class ReportController {
  // === Reports ===
  
  // Получение списка отчетов
  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId, status, generatedBy, search } = req.query;
      
      const filter: any = {};
      if (templateId) filter.templateId = templateId;
      if (status) filter.status = status;
      if (generatedBy) filter.generatedBy = generatedBy;
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const reports = await reportService.getReports(filter);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // Получение отчета по ID
  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);
      
      if (!report) {
        return res.status(404).json({ success: false, message: 'Отчет не найден' });
      }
      
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового отчета
  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const reportData = {
        ...req.body,
        generatedBy: user._id
      };
      
      const report = await reportService.createReport(reportData);
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // Обновление отчета
  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user;
      const reportData = {
        ...req.body,
        updatedBy: user._id
      };
      
      const updated = await reportService.updateReport(id, reportData);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Отчет не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление отчета
  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await reportService.deleteReport(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Отчет не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Report Templates ===
  
  // Получение списка шаблонов отчетов
  async getReportTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isActive, search } = req.query;
      
      const filter: any = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const templates = await reportService.getReportTemplates(filter);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  // Получение шаблона отчета по ID
  async getReportTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await reportService.getReportTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ success: false, message: 'Шаблон отчета не найден' });
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового шаблона отчета
  async createReportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const templateData = {
        ...req.body,
        createdBy: user._id
      };
      
      const template = await reportService.createReportTemplate(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  // Обновление шаблона отчета
  async updateReportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user;
      const templateData = {
        ...req.body,
        updatedBy: user._id
      };
      
      const updated = await reportService.updateReportTemplate(id, templateData);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Шаблон отчета не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление шаблона отчета
  async deleteReportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await reportService.deleteReportTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Шаблон отчета не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Report Generation ===
  
  // Генерация отчета из шаблона
  async generateReportFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params;
      const { parameters } = req.body;
      const user = req.user;
      
      if (!parameters) {
        return res.status(400).json({ success: false, message: 'Необходимо указать параметры' });
      }
      
      const report = await reportService.generateReportFromTemplate(templateId, parameters, user._id);
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // === Report Execution ===
  
  // Выполнение отчета
  async executeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const report = await reportService.executeReport(id);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  // === Report Statistics ===
  
  // Получение статистики отчетов
  async getReportStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getReportStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // === Report Search ===
  
  // Поиск отчетов по названию
  async searchReportsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const reports = await reportService.searchReportsByName(term as string);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // Поиск шаблонов отчетов по названию
  async searchReportTemplatesByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const templates = await reportService.searchReportTemplatesByName(term as string);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  // === Salary Reports ===
  
  // Получение отчетов по зарплате
  async getSalaryReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year, staffId } = req.query;
      
      const filter: any = {};
      if (month) filter.month = month;
      if (year) filter.year = year;
      if (staffId) filter.staffId = staffId;
      
      const reports = await reportService.getSalaryReports(filter);
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // === Report Cleanup ===
  
  // Удаление устаревших отчетов
  async cleanupExpiredReports(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await reportService.cleanupExpiredReports();
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const reportController = new ReportController();