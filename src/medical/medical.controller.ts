import { Request, Response, NextFunction } from 'express';
import { medicalService } from './medical.service';

export class MedicalController {
  // === Health Passports ===
  
  // Получение списка медицинских паспортов
  async getHealthPassports(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, active } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      if (active !== undefined) filter.active = active === 'true';
      
      const passports = await medicalService.getHealthPassports(filter);
      res.json({ success: true, data: passports });
    } catch (error) {
      next(error);
    }
  }

  // Получение медицинского паспорта по ID
  async getHealthPassportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const passport = await medicalService.getHealthPassportById(id);
      
      if (!passport) {
        return res.status(404).json({ success: false, message: 'Медицинский паспорт не найден' });
      }
      
      res.json({ success: true, data: passport });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового медицинского паспорта
  async createHealthPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const passportData = {
        ...req.body,
        doctorId: user._id
      };
      
      const passport = await medicalService.createHealthPassport(passportData);
      res.status(201).json({ success: true, data: passport });
    } catch (error) {
      next(error);
    }
  }

  // Обновление медицинского паспорта
  async updateHealthPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateHealthPassport(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Медицинский паспорт не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление медицинского паспорта
  async deleteHealthPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteHealthPassport(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Медицинский паспорт не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Medical Journals ===
  
  // Получение записей меджурнала
  async getMedicalJournals(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, date } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      if (date) {
        const dateObj = new Date(date as string);
        filter.date = {
          $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          $lte: new Date(dateObj.setHours(23, 59, 59, 999))
        };
      }
      
      const journals = await medicalService.getMedicalJournals(filter);
      res.json({ success: true, data: journals });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи меджурнала по ID
  async getMedicalJournalById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const journal = await medicalService.getMedicalJournalById(id);
      
      if (!journal) {
        return res.status(404).json({ success: false, message: 'Запись меджурнала не найдена' });
      }
      
      res.json({ success: true, data: journal });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи меджурнала
  async createMedicalJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const journalData = {
        ...req.body,
        doctorId: user._id
      };
      
      const journal = await medicalService.createMedicalJournal(journalData);
      res.status(201).json({ success: true, data: journal });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи меджурнала
  async updateMedicalJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateMedicalJournal(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись меджурнала не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи меджурнала
  async deleteMedicalJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteMedicalJournal(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись меджурнала не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Mantoux Records ===
  
  // Получение записей Манту
  async getMantouxRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, year, month } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      
      // Фильтр по году и месяцу
      if (year || month) {
        const dateFilter: any = {};
        if (year) dateFilter.$gte = new Date(`${year}-01-01`);
        if (year) dateFilter.$lte = new Date(`${year}-12-31`);
        if (month) {
          const [y, m] = (month as string).split('-');
          dateFilter.$gte = new Date(`${y}-${m}-01`);
          dateFilter.$lte = new Date(new Date(`${y}-${m}-01`).setMonth(new Date(`${y}-${m}-01`).getMonth() + 1, 0));
        }
        filter.date = dateFilter;
      }
      
      const records = await medicalService.getMantouxRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи Манту по ID
  async getMantouxRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getMantouxRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись Манту не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи Манту
  async createMantouxRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createMantouxRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи Манту
  async updateMantouxRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateMantouxRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись Манту не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи Манту
  async deleteMantouxRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteMantouxRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись Манту не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Somatic Records ===
  
  // Получение соматических записей
  async getSomaticRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      
      const records = await medicalService.getSomaticRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение соматической записи по ID
  async getSomaticRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getSomaticRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Соматическая запись не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой соматической записи
  async createSomaticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createSomaticRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление соматической записи
  async updateSomaticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateSomaticRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Соматическая запись не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление соматической записи
  async deleteSomaticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteSomaticRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Соматическая запись не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Helminth Records ===
  
  // Получение записей глистов
  async getHelminthRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      
      const records = await medicalService.getHelminthRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи глистов по ID
  async getHelminthRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getHelminthRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись глистов не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи глистов
  async createHelminthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createHelminthRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи глистов
  async updateHelminthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateHelminthRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись глистов не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи глистов
  async deleteHelminthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteHelminthRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись глистов не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Tub Positive Records ===
  
  // Получение записей туберкулеза
  async getTubPositiveRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      
      const records = await medicalService.getTubPositiveRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи туберкулеза по ID
  async getTubPositiveRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getTubPositiveRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись туберкулеза не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи туберкулеза
  async createTubPositiveRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createTubPositiveRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи туберкулеза
  async updateTubPositiveRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateTubPositiveRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись туберкулеза не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи туберкулеза
  async deleteTubPositiveRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteTubPositiveRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись туберкулеза не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Infectious Disease Records ===
  
  // Получение записей инфекционных заболеваний
  async getInfectiousDiseaseRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, diseaseType } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      if (diseaseType) filter.diseaseType = diseaseType;
      
      const records = await medicalService.getInfectiousDiseaseRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи инфекционного заболевания по ID
  async getInfectiousDiseaseRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getInfectiousDiseaseRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись инфекционного заболевания не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи инфекционного заболевания
  async createInfectiousDiseaseRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createInfectiousDiseaseRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи инфекционного заболевания
  async updateInfectiousDiseaseRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateInfectiousDiseaseRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись инфекционного заболевания не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи инфекционного заболевания
  async deleteInfectiousDiseaseRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteInfectiousDiseaseRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись инфекционного заболевания не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Contact Infection Records ===
  
  // Получение записей контактных инфекций
  async getContactInfectionRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, infectionType } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      if (infectionType) filter.infectionType = infectionType;
      
      const records = await medicalService.getContactInfectionRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи контактной инфекции по ID
  async getContactInfectionRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getContactInfectionRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись контактной инфекции не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи контактной инфекции
  async createContactInfectionRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createContactInfectionRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи контактной инфекции
  async updateContactInfectionRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateContactInfectionRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись контактной инфекции не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи контактной инфекции
  async deleteContactInfectionRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteContactInfectionRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись контактной инфекции не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Risk Group Children ===
  
  // Получение детей группы риска
  async getRiskGroupChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, doctorId, riskFactor } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (doctorId) filter.doctorId = doctorId;
      if (riskFactor) filter.riskFactors = { $in: [riskFactor] };
      
      const records = await medicalService.getRiskGroupChildren(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи ребенка группы риска по ID
  async getRiskGroupChildById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await medicalService.getRiskGroupChildById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись ребенка группы риска не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи ребенка группы риска
  async createRiskGroupChild(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await medicalService.createRiskGroupChild(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи ребенка группы риска
  async updateRiskGroupChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await medicalService.updateRiskGroupChild(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись ребенка группы риска не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи ребенка группы риска
  async deleteRiskGroupChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await medicalService.deleteRiskGroupChild(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись ребенка группы риска не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Medical Statistics ===
  
  // Получение медицинской статистики
  async getMedicalStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await medicalService.getMedicalStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const medicalController = new MedicalController();