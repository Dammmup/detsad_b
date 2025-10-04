import { Document, Types } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';
import HealthPassport, { IHealthPassport } from './health-passport.model';
import MedicalJournal, { IMedicalJournal } from './medical-journal.model';
import MantouxRecord, { IMantouxRecord } from './mantoux-record.model';
import SomaticRecord, { ISomaticRecord } from './somatic-record.model';
import HelminthRecord, { IHelminthRecord } from './helminth-record.model';
import TubPositiveRecord, { ITubPositiveRecord } from './tub-positive-record.model';
import InfectiousDiseaseRecord, { IInfectiousDiseaseRecord } from './infectious-disease-record.model';
import ContactInfectionRecord, { IContactInfectionRecord } from './contact-infection-record.model';
import RiskGroupChild, { IRiskGroupChild } from './risk-group-child.model';

// Сервис для работы с медицинскими записями
export class MedicalService {
  // === Health Passports ===
  
  // Получение медицинских паспортов с фильтрацией
  async getHealthPassports(filter: any = {}) {
    try {
      return await HealthPassport.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting health passports: ${error}`);
    }
  }

  // Получение медицинского паспорта по ID
  async getHealthPassportById(id: string) {
    try {
      return await HealthPassport.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting health passport by id: ${error}`);
    }
  }

  // Создание нового медицинского паспорта
  async createHealthPassport(passportData: Partial<IHealthPassport>) {
    try {
      const passport = new HealthPassport(passportData);
      return await passport.save();
    } catch (error) {
      throw new Error(`Error creating health passport: ${error}`);
    }
  }

  // Обновление медицинского паспорта
  async updateHealthPassport(id: string, passportData: Partial<IHealthPassport>) {
    try {
      return await HealthPassport.findByIdAndUpdate(id, passportData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating health passport: ${error}`);
    }
  }

  // Удаление медицинского паспорта
  async deleteHealthPassport(id: string) {
    try {
      const result = await HealthPassport.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting health passport: ${error}`);
    }
  }

  // === Medical Journals ===
  
  // Получение записей меджурнала с фильтрацией
  async getMedicalJournals(filter: any = {}) {
    try {
      return await MedicalJournal.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting medical journals: ${error}`);
    }
  }

  // Получение записи меджурнала по ID
  async getMedicalJournalById(id: string) {
    try {
      return await MedicalJournal.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting medical journal by id: ${error}`);
    }
  }

  // Создание новой записи меджурнала
  async createMedicalJournal(journalData: Partial<IMedicalJournal>) {
    try {
      const journal = new MedicalJournal(journalData);
      return await journal.save();
    } catch (error) {
      throw new Error(`Error creating medical journal: ${error}`);
    }
  }

  // Обновление записи меджурнала
  async updateMedicalJournal(id: string, journalData: Partial<IMedicalJournal>) {
    try {
      return await MedicalJournal.findByIdAndUpdate(id, journalData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating medical journal: ${error}`);
    }
  }

  // Удаление записи меджурнала
  async deleteMedicalJournal(id: string) {
    try {
      const result = await MedicalJournal.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting medical journal: ${error}`);
    }
  }

  // === Mantoux Records ===
  
  // Получение записей Манту с фильтрацией
  async getMantouxRecords(filter: any = {}) {
    try {
      return await MantouxRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting mantoux records: ${error}`);
    }
  }

  // Получение записи Манту по ID
  async getMantouxRecordById(id: string) {
    try {
      return await MantouxRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting mantoux record by id: ${error}`);
    }
  }

  // Создание новой записи Манту
  async createMantouxRecord(recordData: Partial<IMantouxRecord>) {
    try {
      const record = new MantouxRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating mantoux record: ${error}`);
    }
  }

  // Обновление записи Манту
  async updateMantouxRecord(id: string, recordData: Partial<IMantouxRecord>) {
    try {
      return await MantouxRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating mantoux record: ${error}`);
    }
  }

  // Удаление записи Манту
  async deleteMantouxRecord(id: string) {
    try {
      const result = await MantouxRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting mantoux record: ${error}`);
    }
  }

  // === Somatic Records ===
  
  // Получение соматических записей с фильтрацией
  async getSomaticRecords(filter: any = {}) {
    try {
      return await SomaticRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting somatic records: ${error}`);
    }
  }

  // Получение соматической записи по ID
  async getSomaticRecordById(id: string) {
    try {
      return await SomaticRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting somatic record by id: ${error}`);
    }
  }

  // Создание новой соматической записи
  async createSomaticRecord(recordData: Partial<ISomaticRecord>) {
    try {
      const record = new SomaticRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating somatic record: ${error}`);
    }
  }

  // Обновление соматической записи
  async updateSomaticRecord(id: string, recordData: Partial<ISomaticRecord>) {
    try {
      return await SomaticRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating somatic record: ${error}`);
    }
  }

  // Удаление соматической записи
  async deleteSomaticRecord(id: string) {
    try {
      const result = await SomaticRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting somatic record: ${error}`);
    }
  }

  // === Helminth Records ===
  
  // Получение записей глистов с фильтрацией
  async getHelminthRecords(filter: any = {}) {
    try {
      return await HelminthRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting helminth records: ${error}`);
    }
  }

  // Получение записи глистов по ID
  async getHelminthRecordById(id: string) {
    try {
      return await HelminthRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting helminth record by id: ${error}`);
    }
  }

  // Создание новой записи глистов
  async createHelminthRecord(recordData: Partial<IHelminthRecord>) {
    try {
      const record = new HelminthRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating helminth record: ${error}`);
    }
  }

  // Обновление записи глистов
  async updateHelminthRecord(id: string, recordData: Partial<IHelminthRecord>) {
    try {
      return await HelminthRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating helminth record: ${error}`);
    }
  }

  // Удаление записи глистов
  async deleteHelminthRecord(id: string) {
    try {
      const result = await HelminthRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting helminth record: ${error}`);
    }
  }

  // === Tub Positive Records ===
  
  // Получение записей туберкулеза с фильтрацией
  async getTubPositiveRecords(filter: any = {}) {
    try {
      return await TubPositiveRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting tub positive records: ${error}`);
    }
  }

  // Получение записи туберкулеза по ID
  async getTubPositiveRecordById(id: string) {
    try {
      return await TubPositiveRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting tub positive record by id: ${error}`);
    }
  }

  // Создание новой записи туберкулеза
  async createTubPositiveRecord(recordData: Partial<ITubPositiveRecord>) {
    try {
      const record = new TubPositiveRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating tub positive record: ${error}`);
    }
  }

  // Обновление записи туберкулеза
  async updateTubPositiveRecord(id: string, recordData: Partial<ITubPositiveRecord>) {
    try {
      return await TubPositiveRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating tub positive record: ${error}`);
    }
  }

  // Удаление записи туберкулеза
  async deleteTubPositiveRecord(id: string) {
    try {
      const result = await TubPositiveRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting tub positive record: ${error}`);
    }
  }

  // === Infectious Disease Records ===
  
  // Получение записей инфекционных заболеваний с фильтрацией
  async getInfectiousDiseaseRecords(filter: any = {}) {
    try {
      return await InfectiousDiseaseRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting infectious disease records: ${error}`);
    }
  }

  // Получение записи инфекционного заболевания по ID
  async getInfectiousDiseaseRecordById(id: string) {
    try {
      return await InfectiousDiseaseRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting infectious disease record by id: ${error}`);
    }
  }

  // Создание новой записи инфекционного заболевания
  async createInfectiousDiseaseRecord(recordData: Partial<IInfectiousDiseaseRecord>) {
    try {
      const record = new InfectiousDiseaseRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating infectious disease record: ${error}`);
    }
  }

  // Обновление записи инфекционного заболевания
  async updateInfectiousDiseaseRecord(id: string, recordData: Partial<IInfectiousDiseaseRecord>) {
    try {
      return await InfectiousDiseaseRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating infectious disease record: ${error}`);
    }
  }

  // Удаление записи инфекционного заболевания
  async deleteInfectiousDiseaseRecord(id: string) {
    try {
      const result = await InfectiousDiseaseRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting infectious disease record: ${error}`);
    }
  }

  // === Contact Infection Records ===
  
  // Получение записей контактных инфекций с фильтрацией
  async getContactInfectionRecords(filter: any = {}) {
    try {
      return await ContactInfectionRecord.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting contact infection records: ${error}`);
    }
  }

  // Получение записи контактной инфекции по ID
  async getContactInfectionRecordById(id: string) {
    try {
      return await ContactInfectionRecord.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting contact infection record by id: ${error}`);
    }
  }

  // Создание новой записи контактной инфекции
  async createContactInfectionRecord(recordData: Partial<IContactInfectionRecord>) {
    try {
      const record = new ContactInfectionRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating contact infection record: ${error}`);
    }
  }

  // Обновление записи контактной инфекции
  async updateContactInfectionRecord(id: string, recordData: Partial<IContactInfectionRecord>) {
    try {
      return await ContactInfectionRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating contact infection record: ${error}`);
    }
  }

  // Удаление записи контактной инфекции
  async deleteContactInfectionRecord(id: string) {
    try {
      const result = await ContactInfectionRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting contact infection record: ${error}`);
    }
  }

  // === Risk Group Children ===
  
  // Получение детей группы риска с фильтрацией
  async getRiskGroupChildren(filter: any = {}) {
    try {
      return await RiskGroupChild.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting risk group children: ${error}`);
    }
  }

  // Получение записи ребенка группы риска по ID
  async getRiskGroupChildById(id: string) {
    try {
      return await RiskGroupChild.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting risk group child by id: ${error}`);
    }
  }

  // Создание новой записи ребенка группы риска
  async createRiskGroupChild(recordData: Partial<IRiskGroupChild>) {
    try {
      const record = new RiskGroupChild(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating risk group child: ${error}`);
    }
  }

  // Обновление записи ребенка группы риска
  async updateRiskGroupChild(id: string, recordData: Partial<IRiskGroupChild>) {
    try {
      return await RiskGroupChild.findByIdAndUpdate(id, recordData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating risk group child: ${error}`);
    }
  }

  // Удаление записи ребенка группы риска
  async deleteRiskGroupChild(id: string) {
    try {
      const result = await RiskGroupChild.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting risk group child: ${error}`);
    }
  }

  // === Medical Statistics ===
  
  // Получение медицинской статистики
  async getMedicalStatistics() {
    try {
      const totalChildren = await Child.countDocuments({ active: true });
      
      // Подсчет записей по типам
      const healthPassportsCount = await HealthPassport.countDocuments();
      const medicalJournalsCount = await MedicalJournal.countDocuments();
      const mantouxRecordsCount = await MantouxRecord.countDocuments();
      const somaticRecordsCount = await SomaticRecord.countDocuments();
      const helminthRecordsCount = await HelminthRecord.countDocuments();
      const tubPositiveRecordsCount = await TubPositiveRecord.countDocuments();
      const infectiousDiseaseRecordsCount = await InfectiousDiseaseRecord.countDocuments();
      const contactInfectionRecordsCount = await ContactInfectionRecord.countDocuments();
      const riskGroupChildrenCount = await RiskGroupChild.countDocuments();
      
      return {
        totalChildren,
        healthPassports: healthPassportsCount,
        medicalJournals: medicalJournalsCount,
        mantouxRecords: mantouxRecordsCount,
        somaticRecords: somaticRecordsCount,
        helminthRecords: helminthRecordsCount,
        tubPositiveRecords: tubPositiveRecordsCount,
        infectiousDiseaseRecords: infectiousDiseaseRecordsCount,
        contactInfectionRecords: contactInfectionRecordsCount,
        riskGroupChildren: riskGroupChildrenCount
      };
    } catch (error) {
      throw new Error(`Error getting medical statistics: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const medicalService = new MedicalService();