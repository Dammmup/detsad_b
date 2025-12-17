import { Request, Response } from 'express';
import { RiskGroupChildrenService } from './service';


let riskGroupChildrenService: RiskGroupChildrenService | null = null;

const getRiskGroupChildrenService = (): RiskGroupChildrenService => {
  if (!riskGroupChildrenService) {
    riskGroupChildrenService = new RiskGroupChildrenService();
  }
  return riskGroupChildrenService;
};

export const getAllRiskGroupChildren = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId, date, doctorId, status, riskFactor, startDate, endDate, nextAssessmentDate } = req.query;

    const children = await getRiskGroupChildrenService().getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      riskFactor: riskFactor as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAssessmentDate: nextAssessmentDate as string
    });

    res.json(children);
  } catch (err) {
    console.error('Error fetching risk group children:', err);
    res.status(500).json({ error: 'Ошибка получения записей группы риска' });
  }
};

export const getRiskGroupChildById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const child = await getRiskGroupChildrenService().getById(req.params.id);
    res.json(child);
  } catch (err: any) {
    console.error('Error fetching risk group child:', err);
    res.status(404).json({ error: err.message || 'Запись группы риска не найдена' });
  }
};

export const createRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const child = await getRiskGroupChildrenService().create(req.body, req.user.id as string);
    res.status(201).json(child);
  } catch (err: any) {
    console.error('Error creating risk group child:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи группы риска' });
  }
};

export const updateRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const child = await getRiskGroupChildrenService().update(req.params.id, req.body);
    res.json(child);
  } catch (err: any) {
    console.error('Error updating risk group child:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи группы риска' });
  }
};

export const deleteRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getRiskGroupChildrenService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting risk group child:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи группы риска' });
  }
};

export const getRiskGroupChildrenByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;
    const { date, doctorId, status, riskFactor, startDate, endDate, nextAssessmentDate } = req.query;

    const children = await getRiskGroupChildrenService().getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      riskFactor: riskFactor as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAssessmentDate: nextAssessmentDate as string
    });

    res.json(children);
  } catch (err: any) {
    console.error('Error fetching risk group children by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей группы риска по ребенку' });
  }
};

export const getRiskGroupChildrenByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { doctorId } = req.params;
    const { childId, status, riskFactor, startDate, endDate, nextAssessmentDate } = req.query;

    const children = await getRiskGroupChildrenService().getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      riskFactor: riskFactor as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextAssessmentDate: nextAssessmentDate as string
    });

    res.json(children);
  } catch (err: any) {
    console.error('Error fetching risk group children by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей группы риска по врачу' });
  }
};

export const getUpcomingAssessments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;

    const children = await getRiskGroupChildrenService().getUpcomingAssessments(daysNum);
    res.json(children);
  } catch (err: any) {
    console.error('Error fetching upcoming assessments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих оценок' });
  }
};

export const updateRiskGroupChildStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }

    const child = await getRiskGroupChildrenService().updateStatus(req.params.id, status);
    res.json(child);
  } catch (err: any) {
    console.error('Error updating risk group child status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи группы риска' });
  }
};

export const addRiskGroupChildRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { recommendations } = req.body;

    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }

    const child = await getRiskGroupChildrenService().addRecommendations(req.params.id, recommendations);
    res.json(child);
  } catch (err: any) {
    console.error('Error adding risk group child recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи группы риска' });
  }
};

export const getRiskGroupChildStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await getRiskGroupChildrenService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching risk group child statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики группы риска' });
  }
};