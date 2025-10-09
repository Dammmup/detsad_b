import { Request, Response } from 'express';
import { ReportsService } from './service';

const reportsService = new ReportsService();

export const getAllReports = async (req: Request, res: Response) => {
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

export const getReportById = async (req: Request, res: Response) => {
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

export const createReport = async (req: Request, res: Response) => {
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

export const updateReport = async (req: Request, res: Response) => {
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

export const deleteReport = async (req: Request, res: Response) => {
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

export const generateReport = async (req: Request, res: Response) => {
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

export const sendReport = async (req: Request, res: Response) => {
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

export const getReportsByType = async (req: Request, res: Response) => {
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

export const getRecentReports = async (req: Request, res: Response) => {
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