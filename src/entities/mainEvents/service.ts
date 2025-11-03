import createMainEventModel, { IMainEvent } from './model';
import EmailService from '../../services/emailService';
import { IChildAttendance } from '../childAttendance/model';
import { IChildPayment } from '../childPayment/model';
import { IShift } from '../staffShifts/model';
import { IPayroll } from '../payroll/model';
import { IRent } from '../rent/model';
import { IReport } from '../reports/model';

// Создаем экземпляры сервисов внутри методов, чтобы избежать проблем с импортами

// Отложенное создание модели
let MainEventModel: any = null;

const getMainEventModel = () => {
  if (!MainEventModel) {
    MainEventModel = createMainEventModel();
  }
  return MainEventModel;
};

export class MainEventsService {
  async getAll(filters: { enabled?: boolean } = {}) {
    const filter: any = {};
    
    if (filters.enabled !== undefined) {
      filter.enabled = filters.enabled;
    }
    
    return await getMainEventModel().find(filter)
      .sort({ createdAt: -1 });
  }

  async getById(id: string) {
    const mainEvent = await getMainEventModel().findById(id);
    
    if (!mainEvent) {
      throw new Error('Событие не найдено');
    }
    
    return mainEvent;
  }

  async create(mainEventData: Partial<IMainEvent>) {
    const mainEvent = new (getMainEventModel())(mainEventData);
    await mainEvent.save();
    
    return mainEvent;
  }

  async update(id: string, data: Partial<IMainEvent>) {
    const updatedMainEvent = await getMainEventModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    
    if (!updatedMainEvent) {
      throw new Error('Событие не найдено');
    }
    
    return updatedMainEvent;
  }

  async delete(id: string) {
    const result = await getMainEventModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Событие не найдено');
    }
    
    return { message: 'Событие успешно удалено' };
  }

  async toggleEnabled(id: string, enabled: boolean) {
    const mainEvent = await getMainEventModel().findByIdAndUpdate(
      id,
      { enabled },
      { new: true }
    );
    
    if (!mainEvent) {
      throw new Error('Событие не найдено');
    }
    
    return mainEvent;
  }

  // Метод для выполнения автоматического экспорта
 async executeScheduledExport(mainEventId: string) {
   const mainEvent = await getMainEventModel().findById(mainEventId);
   
   if (!mainEvent) {
     throw new Error('Событие не найдено');
   }
   
   if (!mainEvent.enabled) {
     throw new Error('Событие не активно');
   }
   
   // Обновляем время последнего выполнения
   mainEvent.lastExecutedAt = new Date();
   mainEvent.nextExecutionAt = this.calculateNextExecution(mainEvent.dayOfMonth);
   await mainEvent.save();
   
   // Подготавливаем данные для экспорта
   const exportData: Record<string, any> = {};
   
   // Экспорт данных для каждой указанной коллекции
   for (const collection of mainEvent.exportCollections) {
     try {
       switch (collection) {
         case 'childAttendance':
           const attendanceData = await this.exportChildAttendance();
           exportData[collection] = attendanceData;
           break;
         case 'childPayment':
           const paymentData = await this.exportChildPayment();
           exportData[collection] = paymentData;
           break;
         case 'staffShifts':
           const shiftData = await this.exportStaffShifts();
           exportData[collection] = shiftData;
           break;
         case 'payroll':
           const payrollData = await this.exportPayroll();
           exportData[collection] = payrollData;
           break;
         case 'rent':
           const rentData = await this.exportRent();
           exportData[collection] = rentData;
           break;
         default:
           console.warn(`Неизвестная коллекция для экспорта: ${collection}`);
       }
     } catch (error: any) {
       console.error(`Ошибка при экспорте коллекции ${collection}:`, error);
       // Продолжаем с другими коллекциями даже если одна из них не удалась
     }
   }
   
   // Отправляем отчет по email
   if (mainEvent.emailRecipients.length > 0) {
     await this.sendExportReport(mainEvent, exportData);
   }
   
   // Удаляем экспортированные записи
   await this.deleteExportedRecords(mainEvent.exportCollections);
   
   return { message: 'Экспорт выполнен успешно', data: exportData };
 }
  
  // Метод для автоматической проверки и выполнения событий
  async checkAndExecuteScheduledEvents() {
    const now = new Date();
    const dayOfMonth = now.getDate(); // День месяца (1-31)
    
    // Находим все активные события, которые должны выполняться в этот день месяца
    const eventsToExecute = await getMainEventModel().find({
      enabled: true,
      dayOfMonth: dayOfMonth
    });
    
    const results = [];
    
    for (const event of eventsToExecute) {
      try {
        const result = await this.executeScheduledExport(event._id.toString());
        results.push({
          eventId: event._id.toString(),
          eventName: event.name,
          result
        });
      } catch (error: any) {
        console.error(`Ошибка при выполнении события ${event.name}:`, error);
        results.push({
          eventId: event._id.toString(),
          eventName: event.name,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  // Метод для ручного запуска проверки и выполнения всех активных событий
  async executeAllScheduledEvents() {
    const now = new Date();
    const dayOfMonth = now.getDate(); // День месяца (1-31)
    
    // Находим все активные события
    const eventsToExecute = await getMainEventModel().find({
      enabled: true
    });
    
    const results = [];
    
    for (const event of eventsToExecute) {
      // Проверяем, соответствует ли день месяца событию
      if (event.dayOfMonth === dayOfMonth) {
        try {
          const result = await this.executeScheduledExport(event._id.toString());
          results.push({
            eventId: event._id.toString(),
            eventName: event.name,
            result
          });
        } catch (error: any) {
          console.error(`Ошибка при выполнении события ${event.name}:`, error);
          results.push({
            eventId: event._id.toString(),
            eventName: event.name,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }
  
  
  // Экспорт данных посещаемости детей
 private async exportChildAttendance(): Promise<IChildAttendance[]> {
   // Временная заглушка - в реальном приложении здесь будет вызов соответствующего сервиса
   console.log('Экспорт данных посещаемости детей');
   return [] as IChildAttendance[];
 }
 
 // Экспорт данных оплат за посещение детей
 private async exportChildPayment(): Promise<IChildPayment[]> {
   // Временная заглушка - в реальном приложении здесь будет вызов соответствующего сервиса
   console.log('Экспорт данных оплат за посещение детей');
   return [] as IChildPayment[];
 }
 
 // Экспорт данных смен сотрудников
 private async exportStaffShifts(): Promise<IShift[]> {
   // Временная заглушка - в реальном приложении здесь будет вызов соответствующего сервиса
   console.log('Экспорт данных смен сотрудников');
   return [] as IShift[];
 }
 
 // Экспорт данных зарплат
 private async exportPayroll(): Promise<IPayroll[]> {
   // Временная заглушка - в реальном приложении здесь будет вызов соответствующего сервиса
   console.log('Экспорт данных зарплат');
   return [] as IPayroll[];
 }
 
 // Экспорт данных аренды
 private async exportRent(): Promise<IRent[]> {
   // Временная заглушка - в реальном приложении здесь будет вызов соответствующего сервиса
   console.log('Экспорт данных аренды');
   return [] as IRent[];
 }
  
  // Удаление экспортированных записей
  private async deleteExportedRecords(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        switch (collection) {
          case 'childAttendance':
            await this.deleteChildAttendanceRecords();
            break;
          case 'childPayment':
            await this.deleteChildPaymentRecords();
            break;
          case 'staffShifts':
            await this.deleteStaffShiftRecords();
            break;
          case 'payroll':
            await this.deletePayrollRecords();
            break;
          case 'rent':
            await this.deleteRentRecords();
            break;
        }
      } catch (error) {
        console.error(`Ошибка при удалении записей коллекции ${collection}:`, error);
      }
    }
  }
  
  // Удаление записей посещаемости
  private async deleteChildAttendanceRecords(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    await (await import('../childAttendance/model')).default().deleteMany({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
  }
  
  // Удаление записей оплат
  private async deleteChildPaymentRecords(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    await (await import('../childPayment/model')).default().deleteMany({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
  }
  
  // Удаление записей смен
  private async deleteStaffShiftRecords(): Promise<void> {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    
    await (await import('../staffShifts/model')).default().deleteMany({
      date: dateString
    });
  }
  
  // Удаление записей зарплат
  private async deletePayrollRecords(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;
    
    await (await import('../payroll/model')).default().deleteMany({
      period: period
    });
  }
  
  // Удаление записей аренды
  private async deleteRentRecords(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;
    
    await (await import('../rent/model')).default().deleteMany({
      period: period
    });
  }
  
  // Отправка отчета по email
 private async sendExportReport(mainEvent: IMainEvent, exportData: Record<string, any>): Promise<void> {
   const subject = `Автоматический экспорт данных - ${mainEvent.name}`;
   let body = `<h2>Отчет об автоматическом экспорте</h2>
               <p><strong>Событие:</strong> ${mainEvent.name}</p>
               <p><strong>Дата выполнения:</strong> ${new Date().toLocaleString('ru-RU')}</p>
               <p><strong>Коллекции:</strong> ${mainEvent.exportCollections.join(', ')}</p>
               <hr>`;
   
   // Добавляем информацию о количестве записей для каждой коллекции
   for (const [collection, data] of Object.entries(exportData)) {
     body += `<h3>${this.getCollectionName(collection)} (${(data as any[]).length} записей)</h3>`;
   }
   
   // Подготавливаем JSON данные для отправки
   const jsonData = JSON.stringify(exportData, null, 2);
   
   // Отправляем email с Excel и JSON файлами
   try {
     // В реальном приложении здесь будет отправка с двумя вложениями
     // Сейчас используем тестовый метод для демонстрации
     console.log('Отправка отчета на email:', mainEvent.emailRecipients[0]);
     console.log('JSON данные для отправки:', jsonData);
     
     // Также можно отправить JSON отдельно, если нужно
   } catch (error) {
     console.error('Ошибка при отправке отчета:', error);
     throw error;
   }
   
 }
  
  // Получение человекочитаемого названия коллекции
  private getCollectionName(collection: string): string {
    const names: Record<string, string> = {
      'childAttendance': 'Посещаемость детей',
      'childPayment': 'Оплаты за посещение детей',
      'staffShifts': 'Смены (раздел сотрудники)',
      'payroll': 'Зарплаты',
      'rent': 'Аренда'
    };
    return names[collection] || collection;
  }
  
 // Расчет следующего времени выполнения
 private calculateNextExecution(dayOfMonth: number): Date {
   const now = new Date();
   const currentDay = now.getDate();
   const nextDate = new Date(now);
   
   // Устанавливаем нужный день месяца
   nextDate.setDate(dayOfMonth);
   
   // Если сегодня уже день выполнения, то следующий месяц
   if (nextDate <= now) {
     nextDate.setMonth(nextDate.getMonth() + 1);
   }
   
   // Устанавливаем время на 00:00:00
   nextDate.setHours(0, 0, 0, 0);
   
   return nextDate;
 }
}