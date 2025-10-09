import { Request, Response } from 'express';
import { HealthPassportService } from './service';

const healthPassportService = new HealthPassportService();

export const getAllHealthPassports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, status, bloodType, rhesus } = req.query;
    
    const passports = await healthPassportService.getAll({
      childId: childId as string,
      status: status as string,
      bloodType: bloodType as string,
      rhesus: rhesus as string
    });
    
    res.json(passports);
  } catch (err) {
    console.error('Error fetching health passports:', err);
    res.status(500).json({ error: 'Ошибка получения медицинских паспортов' });
  }
};

export const getHealthPassportById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await healthPassportService.getById(req.params.id);
    res.json(passport);
  } catch (err: any) {
    console.error('Error fetching health passport:', err);
    res.status(404).json({ error: err.message || 'Медицинский паспорт не найден' });
  }
};

export const getHealthPassportByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    
    const passport = await healthPassportService.getByChildId(childId);
    res.json(passport);
  } catch (err: any) {
    console.error('Error fetching health passport by child ID:', err);
    res.status(404).json({ error: err.message || 'Медицинский паспорт не найден' });
  }
};

export const createHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await healthPassportService.create(req.body);
    res.status(201).json(passport);
  } catch (err: any) {
    console.error('Error creating health passport:', err);
    if (err.message.includes('уже существует')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(400).json({ error: err.message || 'Ошибка создания медицинского паспорта' });
  }
};

export const updateHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await healthPassportService.update(req.params.id, req.body);
    res.json(passport);
  } catch (err: any) {
    console.error('Error updating health passport:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления медицинского паспорта' });
  }
};

export const deleteHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await healthPassportService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting health passport:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления медицинского паспорта' });
  }
};

export const addVaccination = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { vaccination } = req.body;
    
    if (!vaccination) {
      return res.status(400).json({ error: 'Не указана вакцинация' });
    }
    
    const passport = await healthPassportService.addVaccination(req.params.id, vaccination);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding vaccination:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления вакцинации' });
  }
};

export const addDoctorExamination = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { examination } = req.body;
    
    if (!examination) {
      return res.status(400).json({ error: 'Не указан осмотр врача' });
    }
    
    const passport = await healthPassportService.addDoctorExamination(req.params.id, examination);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding doctor examination:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления осмотра врача' });
  }
};

export const addChronicDisease = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disease } = req.body;
    
    if (!disease) {
      return res.status(400).json({ error: 'Не указана хроническая болезнь' });
    }
    
    const passport = await healthPassportService.addChronicDisease(req.params.id, disease);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding chronic disease:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления хронической болезни' });
  }
};

export const addAllergy = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { allergy } = req.body;
    
    if (!allergy) {
      return res.status(400).json({ error: 'Не указана аллергия' });
    }
    
    const passport = await healthPassportService.addAllergy(req.params.id, allergy);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding allergy:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления аллергии' });
  }
};

export const removeChronicDisease = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disease } = req.body;
    
    if (!disease) {
      return res.status(400).json({ error: 'Не указана хроническая болезнь' });
    }
    
    const passport = await healthPassportService.removeChronicDisease(req.params.id, disease);
    res.json(passport);
  } catch (err: any) {
    console.error('Error removing chronic disease:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления хронической болезни' });
  }
};

export const removeAllergy = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { allergy } = req.body;
    
    if (!allergy) {
      return res.status(400).json({ error: 'Не указана аллергия' });
    }
    
    const passport = await healthPassportService.removeAllergy(req.params.id, allergy);
    res.json(passport);
  } catch (err: any) {
    console.error('Error removing allergy:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления аллергии' });
  }
};

export const getUpcomingVaccinations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const vaccinations = await healthPassportService.getUpcomingVaccinations(daysNum);
    res.json(vaccinations);
  } catch (err: any) {
    console.error('Error fetching upcoming vaccinations:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих прививок' });
  }
};

export const getHealthPassportStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await healthPassportService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching health passport statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики медицинских паспортов' });
  }
};