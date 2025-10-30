import mongoose from 'mongoose';
import ChildPayment, { IChildPayment } from './model';
import Child from '../children/model';
import User from '../users/model';

export const createChildPayment = async (paymentData: Partial<IChildPayment>): Promise<IChildPayment> => {
  // Валидация: проверяем, что либо childId, либо userId присутствует
  if (!paymentData.childId && !paymentData.userId) {
    throw new Error('Either childId or userId must be specified');
  }

  // Проверяем существование ребенка или пользователя
  if (paymentData.childId) {
    const child = await Child.findById(paymentData.childId);
    if (!child) {
      throw new Error('Child not found');
    }
  } else if (paymentData.userId) {
    const user = await User.findById(paymentData.userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  const payment = new ChildPayment(paymentData);
  return await payment.save();
};

export const getChildPayments = async (filters: any = {}): Promise<IChildPayment[]> => {
  const query: any = {};

  if (filters.childId) {
    query.childId = new mongoose.Types.ObjectId(filters.childId);
  }
  if (filters.userId) {
    query.userId = new mongoose.Types.ObjectId(filters.userId);
  }
  if (filters.period) {
    // Поддержка фильтрации по новому формату period
    if (typeof filters.period === 'object' && filters.period.start && filters.period.end) {
      query['period.start'] = { $gte: new Date(filters.period.start) };
      query['period.end'] = { $lte: new Date(filters.period.end) };
    } else {
      // Поддержка старого формата для совместимости
      query.period = filters.period;
    }
  }
  if (filters.status) {
    query.status = filters.status;
  }

  return await ChildPayment.find(query)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const getChildPaymentById = async (id: string): Promise<IChildPayment | null> => {
  return await ChildPayment.findById(id)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const updateChildPayment = async (id: string, updateData: Partial<IChildPayment>): Promise<IChildPayment | null> => {
  // Проверяем, существует ли оплата
  const existingPayment = await ChildPayment.findById(id);
  if (!existingPayment) {
    throw new Error('Child payment not found');
  }

  // Если обновляем childId или userId, проверяем их существование
 if (updateData.childId) {
    const child = await Child.findById(updateData.childId);
    if (!child) {
      throw new Error('Child not found');
    }
  } else if (updateData.userId) {
    const user = await User.findById(updateData.userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  return await ChildPayment.findByIdAndUpdate(id, updateData, { new: true })
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const deleteChildPayment = async (id: string): Promise<boolean> => {
  const result = await ChildPayment.findByIdAndDelete(id);
  return !!result;
};

// Функция для получения оплаты по периоду и ребенку/пользователю
export const getChildPaymentByPeriod = async (
  period: {
    start: string;
    end: string;
  },
  childId?: string,
  userId?: string
): Promise<IChildPayment | null> => {
  const query: any = {
    'period.start': new Date(period.start),
    'period.end': new Date(period.end)
  };

 if (childId) {
    query.childId = new mongoose.Types.ObjectId(childId);
  } else if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId);
  } else {
    throw new Error('Either childId or userId must be specified');
  }

  return await ChildPayment.findOne(query)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};