import { Document, Types } from 'mongoose';
import DetergentLog, { IDetergentLog } from './detergent-log.model';
import FoodStaffHealth, { IFoodStaffHealth } from './food-staff-health.model';
import FoodStockLog, { IFoodStockLog } from './food-stock-log.model';
import OrganolepticRecord, { IOrganolepticRecord } from './organoleptic-record.model';
import PerishableBrak, { IPerishableBrak } from './perishable-brak.model';
import ProductCertificate, { IProductCertificate } from './product-certificate.model';

// Сервис для работы с контролем питания
export class FoodControlService {
  // === Detergent Logs ===
  
  // Получение записей о моющих средствах с фильтрацией
  async getDetergentLogs(filter: any = {}) {
    try {
      return await DetergentLog.find(filter)
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting detergent logs: ${error}`);
    }
  }

  // Получение записи о моющем средстве по ID
  async getDetergentLogById(id: string) {
    try {
      return await DetergentLog.findById(id)
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting detergent log by id: ${error}`);
    }
  }

  // Создание новой записи о моющем средстве
  async createDetergentLog(logData: Partial<IDetergentLog>) {
    try {
      const log = new DetergentLog(logData);
      return await log.save();
    } catch (error) {
      throw new Error(`Error creating detergent log: ${error}`);
    }
  }

  // Обновление записи о моющем средстве
  async updateDetergentLog(id: string, logData: Partial<IDetergentLog>) {
    try {
      return await DetergentLog.findByIdAndUpdate(id, logData, { new: true })
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating detergent log: ${error}`);
    }
  }

  // Удаление записи о моющем средстве
  async deleteDetergentLog(id: string) {
    try {
      const result = await DetergentLog.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting detergent log: ${error}`);
    }
  }

  // === Food Staff Health ===
  
  // Получение записей о здоровье сотрудников питания с фильтрацией
  async getFoodStaffHealthRecords(filter: any = {}) {
    try {
      return await FoodStaffHealth.find(filter)
        .populate('staffId', 'fullName role')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting food staff health records: ${error}`);
    }
  }

  // Получение записи о здоровье сотрудника питания по ID
  async getFoodStaffHealthRecordById(id: string) {
    try {
      return await FoodStaffHealth.findById(id)
        .populate('staffId', 'fullName role')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting food staff health record by id: ${error}`);
    }
  }

  // Создание новой записи о здоровье сотрудника питания
  async createFoodStaffHealthRecord(recordData: Partial<IFoodStaffHealth>) {
    try {
      const record = new FoodStaffHealth(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating food staff health record: ${error}`);
    }
  }

  // Обновление записи о здоровье сотрудника питания
  async updateFoodStaffHealthRecord(id: string, recordData: Partial<IFoodStaffHealth>) {
    try {
      return await FoodStaffHealth.findByIdAndUpdate(id, recordData, { new: true })
        .populate('staffId', 'fullName role')
        .populate('doctorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating food staff health record: ${error}`);
    }
  }

  // Удаление записи о здоровье сотрудника питания
  async deleteFoodStaffHealthRecord(id: string) {
    try {
      const result = await FoodStaffHealth.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting food staff health record: ${error}`);
    }
  }

  // === Food Stock Logs ===
  
  // Получение записей о запасах продуктов с фильтрацией
  async getFoodStockLogs(filter: any = {}) {
    try {
      return await FoodStockLog.find(filter)
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting food stock logs: ${error}`);
    }
  }

  // Получение записи о запасе продуктов по ID
  async getFoodStockLogById(id: string) {
    try {
      return await FoodStockLog.findById(id)
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting food stock log by id: ${error}`);
    }
  }

  // Создание новой записи о запасе продуктов
  async createFoodStockLog(logData: Partial<IFoodStockLog>) {
    try {
      const log = new FoodStockLog(logData);
      return await log.save();
    } catch (error) {
      throw new Error(`Error creating food stock log: ${error}`);
    }
  }

  // Обновление записи о запасе продуктов
  async updateFoodStockLog(id: string, logData: Partial<IFoodStockLog>) {
    try {
      return await FoodStockLog.findByIdAndUpdate(id, logData, { new: true })
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating food stock log: ${error}`);
    }
  }

  // Удаление записи о запасе продуктов
  async deleteFoodStockLog(id: string) {
    try {
      const result = await FoodStockLog.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting food stock log: ${error}`);
    }
  }

  // === Organoleptic Records ===
  
  // Получение органолептических записей с фильтрацией
  async getOrganolepticRecords(filter: any = {}) {
    try {
      return await OrganolepticRecord.find(filter)
        .populate('productId', 'productName productType')
        .populate('inspectorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting organoleptic records: ${error}`);
    }
  }

  // Получение органолептической записи по ID
  async getOrganolepticRecordById(id: string) {
    try {
      return await OrganolepticRecord.findById(id)
        .populate('productId', 'productName productType')
        .populate('inspectorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting organoleptic record by id: ${error}`);
    }
  }

  // Создание новой органолептической записи
  async createOrganolepticRecord(recordData: Partial<IOrganolepticRecord>) {
    try {
      const record = new OrganolepticRecord(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating organoleptic record: ${error}`);
    }
  }

  // Обновление органолептической записи
  async updateOrganolepticRecord(id: string, recordData: Partial<IOrganolepticRecord>) {
    try {
      return await OrganolepticRecord.findByIdAndUpdate(id, recordData, { new: true })
        .populate('productId', 'productName productType')
        .populate('inspectorId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating organoleptic record: ${error}`);
    }
  }

  // Удаление органолептической записи
  async deleteOrganolepticRecord(id: string) {
    try {
      const result = await OrganolepticRecord.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting organoleptic record: ${error}`);
    }
  }

  // === Perishable Brak ===
  
  // Получение записей о браке скоропортящихся продуктов с фильтрацией
  async getPerishableBrakRecords(filter: any = {}) {
    try {
      return await PerishableBrak.find(filter)
        .populate('productId', 'productName productType')
        .populate('responsiblePersonId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting perishable brak records: ${error}`);
    }
  }

  // Получение записи о браке скоропортящихся продуктов по ID
  async getPerishableBrakRecordById(id: string) {
    try {
      return await PerishableBrak.findById(id)
        .populate('productId', 'productName productType')
        .populate('responsiblePersonId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting perishable brak record by id: ${error}`);
    }
  }

  // Создание новой записи о браке скоропортящихся продуктов
  async createPerishableBrakRecord(recordData: Partial<IPerishableBrak>) {
    try {
      const record = new PerishableBrak(recordData);
      return await record.save();
    } catch (error) {
      throw new Error(`Error creating perishable brak record: ${error}`);
    }
  }

  // Обновление записи о браке скоропортящихся продуктов
  async updatePerishableBrakRecord(id: string, recordData: Partial<IPerishableBrak>) {
    try {
      return await PerishableBrak.findByIdAndUpdate(id, recordData, { new: true })
        .populate('productId', 'productName productType')
        .populate('responsiblePersonId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating perishable brak record: ${error}`);
    }
  }

  // Удаление записи о браке скоропортящихся продуктов
  async deletePerishableBrakRecord(id: string) {
    try {
      const result = await PerishableBrak.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting perishable brak record: ${error}`);
    }
  }

  // === Product Certificates ===
  
  // Получение сертификатов продуктов с фильтрацией
  async getProductCertificates(filter: any = {}) {
    try {
      return await ProductCertificate.find(filter)
        .populate('supplierId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting product certificates: ${error}`);
    }
  }

  // Получение сертификата продукта по ID
  async getProductCertificateById(id: string) {
    try {
      return await ProductCertificate.findById(id)
        .populate('supplierId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting product certificate by id: ${error}`);
    }
  }

  // Создание нового сертификата продукта
  async createProductCertificate(certificateData: Partial<IProductCertificate>) {
    try {
      const certificate = new ProductCertificate(certificateData);
      return await certificate.save();
    } catch (error) {
      throw new Error(`Error creating product certificate: ${error}`);
    }
  }

  // Обновление сертификата продукта
  async updateProductCertificate(id: string, certificateData: Partial<IProductCertificate>) {
    try {
      return await ProductCertificate.findByIdAndUpdate(id, certificateData, { new: true })
        .populate('supplierId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating product certificate: ${error}`);
    }
  }

  // Удаление сертификата продукта
  async deleteProductCertificate(id: string) {
    try {
      const result = await ProductCertificate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting product certificate: ${error}`);
    }
  }

  // === Statistics ===
  
  // Получение статистики по контролю питания
  async getFoodControlStatistics() {
    try {
      const totalDetergentLogs = await DetergentLog.countDocuments();
      const totalFoodStaffHealthRecords = await FoodStaffHealth.countDocuments();
      const totalFoodStockLogs = await FoodStockLog.countDocuments();
      const totalOrganolepticRecords = await OrganolepticRecord.countDocuments();
      const totalPerishableBrakRecords = await PerishableBrak.countDocuments();
      const totalProductCertificates = await ProductCertificate.countDocuments();
      
      return {
        detergentLogs: {
          total: totalDetergentLogs
        },
        foodStaffHealth: {
          total: totalFoodStaffHealthRecords
        },
        foodStock: {
          total: totalFoodStockLogs
        },
        organoleptic: {
          total: totalOrganolepticRecords
        },
        perishableBrak: {
          total: totalPerishableBrakRecords
        },
        productCertificates: {
          total: totalProductCertificates
        }
      };
    } catch (error) {
      throw new Error(`Error getting food control statistics: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const foodControlService = new FoodControlService();