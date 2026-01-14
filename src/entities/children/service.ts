import { IChild } from './model';
import Child from './model';
import Group from '../groups/model';
import { createChildPayment } from '../childPayment/service';
import mongoose from 'mongoose';

const DEFAULT_PAYMENT_AMOUNT = 40000;

export class ChildService {
  private get childModel() {
    return Child;
  }
  async getAll(): Promise<IChild[]> {
    return await this.childModel.find().populate('groupId');
  }

  async getById(id: string): Promise<IChild | null> {
    return await this.childModel.findById(id).populate('groupId');
  }

  async getByGroupId(groupId: string): Promise<IChild[]> {
    return await this.childModel.find({ groupId }).populate('groupId');
  }

  async create(data: Partial<IChild>): Promise<IChild> {
    // Устанавливаем сумму оплаты по умолчанию если не указана
    if (!data.paymentAmount) {
      data.paymentAmount = DEFAULT_PAYMENT_AMOUNT;
    }

    const child = new this.childModel(data);
    const savedChild = await child.save();

    // Создаем запись платежа за текущий месяц
    try {
      await this.createInitialPayment(savedChild);
    } catch (error) {
      console.error(`Ошибка создания начального платежа для ${savedChild.fullName}:`, error);
      // Не прерываем создание ребенка из-за ошибки платежа
    }

    return savedChild;
  }

  /**
   * Создает начальную запись платежа за текущий месяц для нового ребенка
   */
  private async createInitialPayment(child: IChild): Promise<void> {
    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
    const [year, month] = almatyDateStr.split('-').map(Number);

    const targetYear = year;
    const targetMonth = month - 1; // 0-indexed

    // Начало и конец месяца по Астане
    const currentMonthStart = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
    currentMonthStart.setUTCHours(currentMonthStart.getUTCHours() - 5);

    const currentMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0));
    currentMonthEnd.setUTCMilliseconds(-1);
    currentMonthEnd.setUTCHours(currentMonthEnd.getUTCHours() - 5);

    const monthPeriod = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    const amount = child.paymentAmount || DEFAULT_PAYMENT_AMOUNT;

    await createChildPayment({
      childId: child._id as mongoose.Types.ObjectId,
      period: {
        start: currentMonthStart,
        end: currentMonthEnd,
      },
      monthPeriod,
      amount,
      total: amount,
      status: 'active',
      comments: 'Создан при добавлении ребенка',
    });

    console.log(`Создан начальный платеж для ${child.fullName} за ${monthPeriod}`);
  }

  async update(id: string, data: Partial<IChild>): Promise<IChild | null> {
    const updated = await this.childModel.findByIdAndUpdate(id, data, { new: true }).populate('groupId');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.childModel.findByIdAndDelete(id);
    return !!result;
  }

}



export const getChildren = async (filters: any = {}): Promise<IChild[]> => {
  const childModel = Child;
  return await childModel.find(filters);
};

