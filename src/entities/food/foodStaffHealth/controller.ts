import { Request, Response } from 'express';
import { FoodStaffHealthService } from './service';

const foodStaffHealthService = new FoodStaffHealthService();

export const getAllFoodStaffHealthRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId, date, doctorId, status, healthStatus, vaccinationStatus, startDate, endDate } = req.query;
    
    const records = await foodStaffHealthService.getAll({
      staffId: staffId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      healthStatus: healthStatus as string,
      vaccinationStatus: vaccinationStatus as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(records);
  } catch (err) {
    console.error('Error fetching food staff health records:', err);
    res.status(500).json({ error: 'Ошибка получения записей здоровья сотрудников' });
  }
};

export const getFoodStaffHealthRecordById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const record = await foodStaffHealthService.getById(req.params.id);
    res.json(record);
  } catch (err: any) {
    console.error('Error fetching food staff health record:', err);
    res.status(404).json({ error: err.message || 'Запись здоровья сотрудника не найдена' });
  }
};

export const createFoodStaffHealthRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const record = await foodStaffHealthService.create(req.body, req.user.id as string);
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Error creating food staff health record:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи здоровья сотрудника' });
  }
};

export const updateFoodStaffHealthRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const record = await foodStaffHealthService.update(req.params.id, req.body);
    res.json(record);
  } catch (err: any) {
    console.error('Error updating food staff health record:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи здоровья сотрудника' });
  }
};

export const deleteFoodStaffHealthRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await foodStaffHealthService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting food staff health record:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи здоровья сотрудника' });
  }
};

export const getFoodStaffHealthRecordsByStaffId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId } = req.params;
    const { date, doctorId, status, healthStatus, vaccinationStatus, startDate, endDate } = req.query;
    
    const records = await foodStaffHealthService.getByStaffId(staffId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      healthStatus: healthStatus as string,
      vaccinationStatus: vaccinationStatus as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching food staff health records by staff ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей здоровья сотрудников по сотруднику' });
  }
};

export const getFoodStaffHealthRecordsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { staffId, status, healthStatus, vaccinationStatus, startDate, endDate } = req.query;
    
    const records = await foodStaffHealthService.getByDoctorId(doctorId, {
      staffId: staffId as string,
      status: status as string,
      healthStatus: healthStatus as string,
      vaccinationStatus: vaccinationStatus as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching food staff health records by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей здоровья сотрудников по врачу' });
  }
};

export const getUpcomingMedicalCommissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const records = await foodStaffHealthService.getUpcomingMedicalCommissions(daysNum);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching upcoming medical commissions:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих медицинских комиссий' });
  }
};

export const getUpcomingSanitaryMinimums = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const records = await foodStaffHealthService.getUpcomingSanitaryMinimums(daysNum);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching upcoming sanitary minimums:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих санминимумов' });
  }
};

export const getUpcomingVaccinations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const records = await foodStaffHealthService.getUpcomingVaccinations(daysNum);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching upcoming vaccinations:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих вакцинаций' });
  }
};

export const updateFoodStaffHealthRecordStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const record = await foodStaffHealthService.updateStatus(req.params.id, status);
    res.json(record);
  } catch (err: any) {
    console.error('Error updating food staff health record status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи здоровья сотрудника' });
  }
};

export const addFoodStaffHealthRecordRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const record = await foodStaffHealthService.addRecommendations(req.params.id, recommendations);
    res.json(record);
  } catch (err: any) {
    console.error('Error adding food staff health record recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи здоровья сотрудника' });
  }
};

export const getFoodStaffHealthStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await foodStaffHealthService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching food staff health statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики здоровья сотрудников' });
  }
};