import Payroll from './model';
import { IPayroll } from './model';
import User from '../users/model';
import { IUser } from '../users/model';
import { sendTelegramNotification } from '../../utils/telegramNotify';

export class PayrollService {
  async getAll(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.period) filter.period = filters.period;
    if (filters.status) filter.status = filters.status;
    
    const payrolls = await Payroll().find(filter)
      .populate('staffId', 'fullName role')
      .sort({ period: -1 });
    
    return payrolls;
  }

 async getAllWithUsers(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};
    
    // В этом методе мы не фильтруем пользователей по staffId, так как staffId - это поле в модели Payroll()
    // Вместо этого мы получаем всех пользователей и затем фильтруем по наличию записей в Payroll()
    if (filters.status) filter.status = filters.status;
    
    // Получаем всех пользователей, подходящих под фильтр
    const users = await User().find(filter).select('_id fullName role iin uniqNumber payroll').sort({ fullName: 1 });
    
    // Получаем все записи зарплат для указанного периода, если он задан
    let payrollRecords: any[] = [];
    if (filters.period) {
      payrollRecords = await Payroll().find({ period: filters.period })
        .populate('staffId', 'fullName role')
        .sort({ createdAt: -1 });
    }
    
    // Создаем мапу для быстрого поиска зарплаты по staffId
    const payrollMap = new Map();
    payrollRecords.forEach(record => {
      if (record.staffId && record.staffId._id) {
        payrollMap.set(record.staffId._id.toString(), record);
      }
    });
    
    // Объединяем данные пользователей с данными зарплат
    const result = users.map(user => {
      const payroll = user._id ? payrollMap.get((user._id as any).toString()) : null;
      
      if (payroll) {
        // Если есть запись в коллекции зарплат, возвращаем её
        return payroll;
      } else {
        // Если нет записи в коллекции зарплат, создаем виртуальную запись на основе данных пользователя
        // Рассчитываем итоговую сумму в зависимости от данных в зарплате
        // Если у пользователя есть связь с зарплатой, можно получить дополнительные данные
        let calculatedBaseSalary = 0;
        let calculatedTotal = calculatedBaseSalary;
        
        // Определяем количество рабочих дней в месяце (по умолчанию 22)
        const workingDaysInPeriod = 22; // Стандартное количество рабочих дней в месяце
        let workedDays = 0; // Количество отработанных дней (в реальном приложении нужно получать из системы посещаемости)
        let workedShifts = 0; // Количество отработанных смен (в реальном приложении нужно получать из системы посещаемости)
        
        // Если указан период, можем рассчитать зарплату более точно
        if (filters.period) {
          // В реальном приложении здесь должен быть вызов сервиса посещаемости для получения отработанных дней/смен
          // Пока используем заглушку, в реальном приложении нужно будет получить данные из соответствующих коллекций
          
          // В новой архитектуре информация о типе оплаты и ставках должна быть в записи зарплаты
          // или в отдельной коллекции настроек зарплаты для пользователя
          workedDays = 2; // Временно устанавливаем 2 отработанных дня
        }
        
        // Рассчитываем итоговую зарплату: начисления - вычеты
        calculatedTotal = calculatedBaseSalary + (0) /* bonuses */ - (0) /* deductions */;
        
        return {
          _id: null, // Отсутствие ID указывает на то, что записи в базе нет
          staffId: {
            _id: user._id,
            fullName: user.fullName,
            role: user.role
          },
          period: filters.period || null,
          baseSalary: calculatedBaseSalary,
          bonuses: 0,
          deductions: 0,
          total: calculatedTotal,
          status: 'draft',
          accruals: calculatedBaseSalary,
          baseSalaryType: '',
          shiftRate: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Поля, которые не существуют в виртуальной записи
          paymentDate: undefined,
          history: undefined,
          // Добавляем поля для отработанных дней/смен
          workedDays: workedDays,
          workedShifts: workedShifts
        };
      }
    });
    return result.filter(item => item !== null); // Фильтруем null значения, если они появились
  }

 async getById(id: string) {
    const payroll = await Payroll().findById(id)
      .populate('staffId', 'fullName role');
    
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }
    
    return payroll;
  }

 async create(payrollData: Partial<IPayroll>) {
    // Вычисляем общую сумму
    const total = (payrollData.baseSalary || 0) +
                  (payrollData.bonuses || 0) -
                  (payrollData.deductions || 0) -
                  (payrollData.advance || 0);
    
    const newPayrollData = {
      ...payrollData,
      total
    };
    
    const payroll = new (Payroll())(newPayrollData);
    await payroll.save();
    
    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role telegramChatId');
    // Уведомление в Telegram
    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `Ваша зарплата за период ${populatedPayroll.period}:\n` +
        `Основная: ${populatedPayroll.baseSalary} тг\n` +
        `Бонусы: ${populatedPayroll.bonuses} тг\n` +
        `Вычеты: ${populatedPayroll.deductions} тг\n` +
        `Аванс: ${populatedPayroll.advance || 0} тг\n` +
        `ИТОГО: ${populatedPayroll.total} тг\n` +
        `Статус: ${(populatedPayroll.status === 'paid') ? 'Выплачено' : 'Начислено'}`;
      await sendTelegramNotification((populatedPayroll.staffId as any).telegramChatId, msg);
    }
    return populatedPayroll;
  }

  async update(id: string, data: Partial<IPayroll>) {
    // При обновлении пересчитываем общую сумму
    if (data.baseSalary !== undefined ||
        data.bonuses !== undefined ||
        data.deductions !== undefined ||
        data.advance !== undefined) {
      
      const payroll = await Payroll().findById(id);
      if (!payroll) {
        throw new Error('Зарплата не найдена');
      }
      
      const baseSalary = data.baseSalary !== undefined ? data.baseSalary : payroll.baseSalary;
      const bonuses = data.bonuses !== undefined ? data.bonuses : payroll.bonuses;
      const deductions = data.deductions !== undefined ? data.deductions : payroll.deductions;
      const advance = data.advance !== undefined ? data.advance : payroll.advance || 0;
      
      data.total = baseSalary + bonuses - deductions - advance;
    }
    
    const updatedPayroll = await Payroll().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role telegramChatId');
    
    if (!updatedPayroll) {
      throw new Error('Зарплата не найдена');
    }
    // Уведомление в Telegram
    if (updatedPayroll?.staffId && (updatedPayroll.staffId as any).telegramChatId) {
      let msg = `Ваша зарплата за период ${updatedPayroll.period}:\n` +
        `Основная: ${updatedPayroll.baseSalary} тг\n` +
        `Бонусы: ${updatedPayroll.bonuses} тг\n` +
        `Вычеты: ${updatedPayroll.deductions} тг\n` +
        `Аванс: ${updatedPayroll.advance || 0} тг\n` +
        `ИТОГО: ${updatedPayroll.total} тг\n` +
        `Статус: ${(updatedPayroll.status === 'paid') ? 'Выплачено' : 'Начислено'}`;
      await sendTelegramNotification((updatedPayroll.staffId as any).telegramChatId, msg);
    }
    return updatedPayroll;
  }

  async delete(id: string) {
    const result = await Payroll().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Зарплата не найдена');
    }
    
    return { message: 'Зарплата успешно удалена' };
  }

  async approve(id: string) {
    const payroll = await Payroll().findByIdAndUpdate(
      id,
      {
        status: 'approved',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }
    
    return payroll;
 }

  async markAsPaid(id: string) {
    const payroll = await Payroll().findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }
    
    return payroll;
  }

 /**
  * Добавляет штраф к записи зарплаты
  */
 async addFine(payrollId: string, fineData: { amount: number; reason: string; type: string; notes?: string }) {
   const payroll = await Payroll().findById(payrollId);
   if (!payroll) {
     throw new Error('Зарплата не найдена');
   }

   // Создаем новый штраф
   const fine = {
     amount: Number(fineData.amount),
     reason: fineData.reason,
     type: fineData.type,
     notes: fineData.notes,
     date: new Date(),
     createdAt: new Date()
   };

   // Добавляем штраф в массив
   if (!payroll.fines) {
     payroll.fines = [];
   }
   payroll.fines.push(fine);

   // Обновляем общую сумму штрафов
   const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
   payroll.userFines = totalFines;
   payroll.penalties = (payroll.penalties || 0) + fine.amount;
   payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

   await payroll.save();

   const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role');
   return populatedPayroll;
 }

 /**
  * Получает все штрафы для записи зарплаты
  */
 async getFines(payrollId: string) {
   const payroll = await Payroll().findById(payrollId);
   if (!payroll) {
     throw new Error('Зарплата не найдена');
   }

   return payroll.fines || [];
 }

 /**
  * Удаляет штраф из записи зарплаты
  */
 async removeFine(payrollId: string, fineIndex: number) {
   const payroll = await Payroll().findById(payrollId);
   if (!payroll) {
     throw new Error('Зарплата не найдена');
   }

   if (!payroll.fines || fineIndex < 0 || fineIndex >= payroll.fines.length) {
     throw new Error('Штраф не найден');
   }

   // Получаем сумму удаляемого штрафа
   const removedFine = payroll.fines.splice(fineIndex, 1)[0];
   const fineAmount = removedFine.amount;

   // Обновляем общую сумму штрафов
   const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
   payroll.userFines = totalFines;
   payroll.penalties = Math.max(0, (payroll.penalties || 0) - fineAmount);
   payroll.total = (payroll.accruals || 0) - (payroll.penalties || 0);

   await payroll.save();

   const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role');
   return populatedPayroll;
 }

 /**
  * Получает общую сумму штрафов для записи зарплаты
  */
 async getTotalFines(payrollId: string) {
   const payroll = await Payroll().findById(payrollId);
   if (!payroll) {
     throw new Error('Зарплата не найдена');
   }

   return payroll.userFines || 0;
 }
}