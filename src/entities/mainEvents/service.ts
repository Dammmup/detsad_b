import createMainEventModel, { IMainEvent } from './model';
import MainEvent from './model';
import EmailService from '../../services/emailService';
import { IChildAttendance } from '../childAttendance/model';
import { IChildPayment } from '../childPayment/model';
import { IShift } from '../staffShifts/model';
import { IPayroll } from '../payroll/model';
import { IRent } from '../rent/model';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import ChildAttendance from '../childAttendance/model';
import ChildPayment from '../childPayment/model';
import StaffShift from '../staffShifts/model';
import Payroll from '../payroll/model';
import Rent from '../rent/model';




let MainEventModel: any = null;

const getMainEventModel = () => {
  if (!MainEventModel) {
    MainEventModel = MainEvent;
  }
  return MainEventModel;
};

export class MainEventsService {
  async getAll(filters: { enabled?: boolean } = {}) {
    const filter: any = {};

    if (filters.enabled !== undefined) {
      filter.enabled = filters.enabled;
    }

    return await MainEvent.find(filter)
      .sort({ createdAt: -1 });
  }

  async getById(id: string) {
    const mainEvent = await MainEvent.findById(id);

    if (!mainEvent) {
      throw new Error('Событие не найдено');
    }

    return mainEvent;
  }

  async create(mainEventData: Partial<IMainEvent>) {
    const mainEvent = new MainEvent(mainEventData);
    await mainEvent.save();

    return mainEvent;
  }

  async update(id: string, data: Partial<IMainEvent>) {
    const updatedMainEvent = await MainEvent.findByIdAndUpdate(
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
    const result = await MainEvent.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Событие не найдено');
    }

    return { message: 'Событие успешно удалено' };
  }

  async toggleEnabled(id: string, enabled: boolean) {
    const mainEvent = await MainEvent.findByIdAndUpdate(
      id,
      { enabled },
      { new: true }
    );

    if (!mainEvent) {
      throw new Error('Событие не найдено');
    }

    return mainEvent;
  }


  async executeScheduledExport(mainEventId: string) {
    const mainEvent = await MainEvent.findById(mainEventId);

    if (!mainEvent) {
      throw new Error('Событие не найдено');
    }

    if (!mainEvent.enabled) {
      throw new Error('Событие не активно');
    }


    mainEvent.lastExecutedAt = new Date();
    mainEvent.nextExecutionAt = this.calculateNextExecution(mainEvent.dayOfMonth);
    await mainEvent.save();


    const exportData: Record<string, any> = {};


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

      }
    }


    if (mainEvent.emailRecipients.length > 0) {
      await this.sendExportReport(mainEvent, exportData);
    }


    await this.deleteExportedRecords(mainEvent.exportCollections);

    return { message: 'Экспорт выполнен успешно', data: exportData };
  }


  async checkAndExecuteScheduledEvents() {
    const now = new Date();
    const dayOfMonth = now.getDate();


    const eventsToExecute = await MainEvent.find({
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


    const timeInAstana = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
    if (timeInAstana.getHours() === 10 && timeInAstana.getMinutes() === 0) {
      await sendLogToTelegram(`В 10:0 по времени Астаны: ${results.length} событий выполнено`);
    }

    return results;
  }


  async executeAllScheduledEvents() {
    const now = new Date();
    const dayOfMonth = now.getDate();


    const eventsToExecute = await MainEvent.find({
      enabled: true
    });

    const results = [];

    for (const event of eventsToExecute) {

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



  private async exportChildAttendance(): Promise<IChildAttendance[]> {

    console.log('Экспорт данных посещаемости детей');
    return [] as IChildAttendance[];
  }


  private async exportChildPayment(): Promise<IChildPayment[]> {

    console.log('Экспорт данных оплат за посещение детей');
    return [] as IChildPayment[];
  }


  private async exportStaffShifts(): Promise<IShift[]> {

    console.log('Экспорт данных смен сотрудников');
    return [] as IShift[];
  }


  private async exportPayroll(): Promise<IPayroll[]> {

    console.log('Экспорт данных зарплат');
    return [] as IPayroll[];
  }


  private async exportRent(): Promise<IRent[]> {

    console.log('Экспорт данных аренды');
    return [] as IRent[];
  }


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


  private async deleteChildAttendanceRecords(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    await ChildAttendance.deleteMany({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
  }


  private async deleteChildPaymentRecords(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    await ChildPayment.deleteMany({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
  }


  private async deleteStaffShiftRecords(): Promise<void> {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    await StaffShift.deleteMany({
      date: dateString
    });
  }


  private async deletePayrollRecords(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    await Payroll.deleteMany({
      period: period
    });
  }


  private async deleteRentRecords(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    await Rent.deleteMany({
      period: period
    });
  }


  private async sendExportReport(mainEvent: IMainEvent, exportData: Record<string, any>): Promise<void> {
    const subject = `Автоматический экспорт данных - ${mainEvent.name}`;
    let body = `<h2>Отчет об автоматическом экспорте</h2>
               <p><strong>Событие:</strong> ${mainEvent.name}</p>
               <p><strong>Дата выполнения:</strong> ${new Date().toLocaleString('ru-RU')}</p>
               <p><strong>Коллекции:</strong> ${mainEvent.exportCollections.join(', ')}</p>
               <hr>`;


    for (const [collection, data] of Object.entries(exportData)) {
      body += `<h3>${this.getCollectionName(collection)} (${(data as any[]).length} записей)</h3>`;
    }


    const jsonData = JSON.stringify(exportData, null, 2);


    try {


      console.log('Отправка отчета на email:', mainEvent.emailRecipients[0]);
      console.log('JSON данные для отправки:', jsonData);


    } catch (error) {
      console.error('Ошибка при отправке отчета:', error);
      throw error;
    }

  }


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


  private calculateNextExecution(dayOfMonth: number): Date {
    const now = new Date();
    const currentDay = now.getDate();
    const nextDate = new Date(now);


    nextDate.setDate(dayOfMonth);


    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }


    nextDate.setHours(0, 0, 0, 0);

    return nextDate;
  }
}