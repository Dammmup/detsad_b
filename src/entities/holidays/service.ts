import mongoose from 'mongoose';
import { IHoliday } from './model';
import { getModel } from '../../config/modelRegistry';

export class HolidaysService {
  /**
   * Получить все праздники
   */
  async getAll(filters?: { year?: number; month?: number; isRecurring?: boolean }) {
    const query: any = {};
    
    if (filters) {
      if (filters.year) {
        // Если указан год, ищем как повторяющиеся праздники, так и специфичные для года
        query.$or = [
          { isRecurring: true },
          { year: filters.year }
        ];
      }
      
      if (filters.month) {
        query.month = filters.month;
      }
      
      if (filters.isRecurring !== undefined) {
        query.isRecurring = filters.isRecurring;
      }
    }
    
    const Holiday = getModel<IHoliday>('Holiday');
    return await Holiday.find(query).sort({ month: 1, day: 1 });
  }

  /**
   * Получить праздник по ID
   */
  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid holiday ID');
    }
    
    const Holiday = getModel<IHoliday>('Holiday');
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new Error('Holiday() not found');
    }
    
    return holiday;
  }

  /**
   * Создать новый праздник
   */
  async create(holidayData: Partial<IHoliday>) {
    // Проверяем, что день и месяц в допустимом диапазоне
    if (!holidayData.day || holidayData.day < 1 || holidayData.day > 31) {
      throw new Error('Day must be between 1 and 31');
    }
    
    if (!holidayData.month || holidayData.month < 1 || holidayData.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    
    // Если праздник не повторяющийся, но не указан год, требуем указать год
    if (holidayData.isRecurring === false && !holidayData.year) {
      throw new Error('Year is required for non-recurring holidays');
    }
    
    const Holiday = getModel<IHoliday>('Holiday');
    const holiday = new Holiday(holidayData);
    return await holiday.save();
  }

  /**
   * Обновить праздник
   */
  async update(id: string, data: Partial<IHoliday>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid holiday ID');
    }
    
    // Проверяем, что день и месяц в допустимом диапазоне
    if (data.day !== undefined && (data.day < 1 || data.day > 31)) {
      throw new Error('Day must be between 1 and 31');
    }
    
    if (data.month !== undefined && (data.month < 1 || data.month > 12)) {
      throw new Error('Month must be between 1 and 12');
    }
    
    // Если праздник не повторяющийся, но не указан год, требуем указать год
    if (data.isRecurring === false && !data.year) {
      throw new Error('Year is required for non-recurring holidays');
    }
    
    // Проверяем, существует ли уже праздник с такими же параметрами (день, месяц, год)
    const Holiday = getModel<IHoliday>('Holiday');
    const existingHoliday = await Holiday.findOne({
      day: data.day !== undefined ? data.day : (await Holiday.findById(id))?.day,
      month: data.month !== undefined ? data.month : (await Holiday.findById(id))?.month,
      year: data.year !== undefined ? data.year : (await Holiday.findById(id))?.year,
      _id: { $ne: id } // Исключаем текущий праздник из проверки
    });
    
    if (existingHoliday) {
      throw new Error('Праздник с такой датой уже существует');
    }
    
    const holiday = await Holiday.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );
    
    if (!holiday) {
      throw new Error('Holiday() not found');
    }
    
    return holiday;
  }

  /**
   * Удалить праздник
   */
  async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid holiday ID');
    }
    
    const Holiday = getModel<IHoliday>('Holiday');
    const holiday = await Holiday.findByIdAndDelete(id);
    
    if (!holiday) {
      throw new Error('Holiday() not found');
    }
    
    return holiday;
  }

  /**
   * Проверить, является ли дата праздничной
   */
  async isHoliday(date: Date): Promise<boolean> {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Месяцы в JavaScript начинаются с 0
    const year = date.getFullYear();
    
    // Проверяем, есть ли праздник в этот день и месяц
    const Holiday = getModel<IHoliday>('Holiday');
    const holiday = await Holiday.findOne({
      day: day,
      month: month,
      $or: [
        { isRecurring: true },
        { year: year }
      ]
    });
    
    return !!holiday;
  }

  /**
   * Получить праздник для конкретной даты
   */
  async getHolidayForDate(date: Date): Promise<IHoliday | null> {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Месяцы в JavaScript начинаются с 0
    const year = date.getFullYear();
    
    const Holiday = getModel<IHoliday>('Holiday');
    return await Holiday.findOne({
      day: day,
      month: month,
      $or: [
        { isRecurring: true },
        { year: year }
      ]
    });
  }

  /**
   * Получить праздники в диапазоне дат
   */
 async getHolidaysInRange(startDate: Date, endDate: Date): Promise<IHoliday[]> {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    // Получаем все праздники, которые могут попасть в диапазон
    const holidays: IHoliday[] = [];
    
    // Для каждого года в диапазоне
    for (let year = startYear; year <= endYear; year++) {
      // Получаем все праздники для этого года (повторяющиеся и специфичные)
      const Holiday = getModel<IHoliday>('Holiday');
      const yearHolidays = await Holiday.find({
        $or: [
          { isRecurring: true },
          { year: year }
        ]
      });
      
      // Проверяем, попадает ли каждый праздник в диапазон дат
      for (const holiday of yearHolidays) {
        const holidayDate = new Date(year, holiday.month - 1, holiday.day);
        
        if (holidayDate >= startDate && holidayDate <= endDate) {
          holidays.push(holiday);
        }
      }
    }
    
    return holidays;
  }
}