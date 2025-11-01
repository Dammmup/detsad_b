import { Request, Response } from 'express';
import { ChildHealthPassportService } from './service';

const childHealthPassportService = new ChildHealthPassportService();

export const getAllChildHealthPassports = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, status, bloodType, rhesusFactor, startDate, endDate, nextExaminationDate, vaccinationDate, doctorExaminationDate } = req.query;
    
    const passports = await childHealthPassportService.getAll({
      childId: childId as string,
      status: status as string,
      bloodType: bloodType as string,
      rhesusFactor: rhesusFactor as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextExaminationDate: nextExaminationDate as string,
      vaccinationDate: vaccinationDate as string,
      doctorExaminationDate: doctorExaminationDate as string
    });
    
    res.json(passports);
  } catch (err) {
    console.error('Error fetching child health passports:', err);
    res.status(500).json({ error: 'Ошибка получения медицинских паспортов детей' });
  }
};

export const getChildHealthPassportById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await childHealthPassportService.getById(req.params.id);
    res.json(passport);
  } catch (err: any) {
    console.error('Error fetching child health passport:', err);
    res.status(404).json({ error: err.message || 'Медицинский паспорт ребенка не найден' });
  }
};

export const createChildHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await childHealthPassportService.create(req.body, req.user.id as string);
    res.status(201).json(passport);
  } catch (err: any) {
    console.error('Error creating child health passport:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания медицинского паспорта ребенка' });
  }
};

export const updateChildHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passport = await childHealthPassportService.update(req.params.id, req.body);
    res.json(passport);
  } catch (err: any) {
    console.error('Error updating child health passport:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления медицинского паспорта ребенка' });
  }
};

export const deleteChildHealthPassport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await childHealthPassportService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting child health passport:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления медицинского паспорта ребенка' });
  }
};

export const getChildHealthPassportsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { status, bloodType, rhesusFactor, startDate, endDate, nextExaminationDate, vaccinationDate, doctorExaminationDate } = req.query;
    
    const passports = await childHealthPassportService.getByChildId(childId, {
      status: status as string,
      bloodType: bloodType as string,
      rhesusFactor: rhesusFactor as string,
      startDate: startDate as string,
      endDate: endDate as string,
      nextExaminationDate: nextExaminationDate as string,
      vaccinationDate: vaccinationDate as string,
      doctorExaminationDate: doctorExaminationDate as string
    });
    
    res.json(passports);
  } catch (err: any) {
    console.error('Error fetching child health passports by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения медицинских паспортов детей по ребенку' });
  }
};

export const getUpcomingExaminations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const passports = await childHealthPassportService.getUpcomingExaminations(daysNum);
    res.json(passports);
  } catch (err: any) {
    console.error('Error fetching upcoming examinations:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих осмотров' });
  }
};

export const updateChildHealthPassportStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const passport = await childHealthPassportService.updateStatus(req.params.id, status);
    res.json(passport);
  } catch (err: any) {
    console.error('Error updating child health passport status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса медицинского паспорта ребенка' });
  }
};

export const addChildHealthPassportRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const passport = await childHealthPassportService.addRecommendations(req.params.id, recommendations);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding child health passport recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к медицинскому паспорту ребенка' });
  }
};

export const addChildHealthPassportVaccination = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { vaccination } = req.body;
    
    if (!vaccination) {
      return res.status(400).json({ error: 'Не указана вакцинация' });
    }
    
    const passport = await childHealthPassportService.addVaccination(req.params.id, vaccination);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding child health passport vaccination:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления вакцинации к медицинскому паспорту ребенка' });
  }
};

export const addChildHealthPassportDoctorExamination = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { examination } = req.body;
    
    if (!examination) {
      return res.status(400).json({ error: 'Не указан осмотр врача' });
    }
    
    const passport = await childHealthPassportService.addDoctorExamination(req.params.id, examination);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding child health passport doctor examination:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления осмотра врача к медицинскому паспорту ребенка' });
  }
};

export const addChildHealthPassportChronicDisease = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disease } = req.body;
    
    if (!disease) {
      return res.status(400).json({ error: 'Не указано хроническое заболевание' });
    }
    
    const passport = await childHealthPassportService.addChronicDisease(req.params.id, disease);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding child health passport chronic disease:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления хронического заболевания к медицинскому паспорту ребенка' });
  }
};

export const addChildHealthPassportAllergy = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { allergy } = req.body;
    
    if (!allergy) {
      return res.status(400).json({ error: 'Не указана аллергия' });
    }
    
    const passport = await childHealthPassportService.addAllergy(req.params.id, allergy);
    res.json(passport);
  } catch (err: any) {
    console.error('Error adding child health passport allergy:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления аллергии к медицинскому паспорту ребенка' });
  }
};

export const removeChildHealthPassportChronicDisease = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disease } = req.body;
    
    if (!disease) {
      return res.status(400).json({ error: 'Не указано хроническое заболевание' });
    }
    
    const passport = await childHealthPassportService.removeChronicDisease(req.params.id, disease);
    res.json(passport);
  } catch (err: any) {
    console.error('Error removing child health passport chronic disease:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления хронического заболевания из медицинского паспорта ребенка' });
  }
};

export const removeChildHealthPassportAllergy = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { allergy } = req.body;
    
    if (!allergy) {
      return res.status(400).json({ error: 'Не указана аллергия' });
    }
    
    const passport = await childHealthPassportService.removeAllergy(req.params.id, allergy);
    res.json(passport);
  } catch (err: any) {
    console.error('Error removing child health passport allergy:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления аллергии из медицинского паспорта ребенка' });
  }
};

export const getChildHealthPassportStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await childHealthPassportService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching child health passport statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики медицинских паспортов детей' });
  }
};