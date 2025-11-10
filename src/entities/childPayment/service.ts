import mongoose from 'mongoose';
import ChildPayment, { IChildPayment } from './model';
import Child from '../children/model';
import User from '../users/model';

// Отложенное создание моделей
let ChildPaymentModel: any = null;
let ChildModel: any = null;
let UserModel: any = null;

const getChildPaymentModel = () => {
  if (!ChildPaymentModel) {
    ChildPaymentModel = ChildPayment();
  }
  return ChildPaymentModel;
};

const getChildModel = () => {
  if (!ChildModel) {
    ChildModel = Child();
  }
  return ChildModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User();
  }
  return UserModel;
};

export const createChildPayment = async (paymentData: Partial<IChildPayment>): Promise<IChildPayment> => {
  // Валидация: проверяем, что либо childId, либо userId присутствует
  if (!paymentData.childId && !paymentData.userId) {
    throw new Error('Either childId or userId must be specified');
  }

  // Проверяем существование ребенка или пользователя
  if (paymentData.childId) {
    const child = await getChildModel().findById(paymentData.childId);
    if (!child) {
      throw new Error('Child not found');
    }
  } else if (paymentData.userId) {
    const user = await getUserModel().findById(paymentData.userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  const childPaymentModel = getChildPaymentModel();
  const payment = new childPaymentModel(paymentData);
  return await payment.save();
};

export const getChildPayments = async (filters: any = {}): Promise<IChildPayment[]> => {
  const childPaymentModel = getChildPaymentModel();
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
  if (filters['period.start']) {
    query['period.start'] = filters['period.start'];
  }
  if (filters['period.end']) {
    query['period.end'] = filters['period.end'];
  }
  if (filters.status) {
    query.status = filters.status;
  }

  return await childPaymentModel.find(query)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const getChildPaymentById = async (id: string): Promise<IChildPayment | null> => {
  const childPaymentModel = getChildPaymentModel();
  return await childPaymentModel.findById(id)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const updateChildPayment = async (id: string, updateData: Partial<IChildPayment>): Promise<IChildPayment | null> => {
  const childPaymentModel = getChildPaymentModel();
  // Проверяем, существует ли оплата
  const existingPayment = await childPaymentModel.findById(id);
  if (!existingPayment) {
    throw new Error('Child payment not found');
  }

  // Если обновляем childId или userId, проверяем их существование
  if (updateData.childId) {
    const child = await getChildModel().findById(updateData.childId);
    if (!child) {
      throw new Error('Child not found');
    }
  } else if (updateData.userId) {
    const user = await getUserModel().findById(updateData.userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  return await childPaymentModel.findByIdAndUpdate(id, updateData, { new: true })
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};

export const deleteChildPayment = async (id: string): Promise<boolean> => {
  const childPaymentModel = getChildPaymentModel();
  const result = await childPaymentModel.findByIdAndDelete(id);
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
  const childPaymentModel = getChildPaymentModel();
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

  return await childPaymentModel.findOne(query)
    .populate('childId', 'fullName')
    .populate('userId', 'fullName');
};