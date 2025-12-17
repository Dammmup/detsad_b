import FoodStockLog from './model';
import { IFoodStockLog } from './model';
import User from '../../users/model';
import Product from '../products/model';


let FoodStockLogModel: any = null;
let UserModel: any = null;

const getFoodStockLogModel = () => {
  if (!FoodStockLogModel) {
    FoodStockLogModel = FoodStockLog;
  }
  return FoodStockLogModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User;
  }
  return UserModel;
};


let ProductModel: any = null;

const getProductModel = () => {
  if (!ProductModel) {
    ProductModel = Product;
  }
  return ProductModel;
};

export class FoodStockLogService {
  async getAll(filters: { productId?: string, batchNumber?: string, supplier?: string, status?: string, startDate?: string, endDate?: string, expirationStartDate?: string, expirationEndDate?: string, productName?: string, supplierContact?: string }) {
    const filter: any = {};

    if (filters.productId) filter.productId = filters.productId;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;
    if (filters.supplier) filter.supplier = filters.supplier;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplierContact) filter.supplierContact = filters.supplierContact;

    if (filters.startDate || filters.endDate) {
      filter.deliveryDate = {};
      if (filters.startDate) filter.deliveryDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.deliveryDate.$lte = new Date(filters.endDate);
    }

    if (filters.expirationStartDate || filters.expirationEndDate) {
      filter.expirationDate = {};
      if (filters.expirationStartDate) filter.expirationDate.$gte = new Date(filters.expirationStartDate);
      if (filters.expirationEndDate) filter.expirationDate.$lte = new Date(filters.expirationEndDate);
    }

    const logs = await FoodStockLog.find(filter)
      .populate('productId', 'name')
      .populate('receiver', 'fullName role')
      .sort({ deliveryDate: -1 });

    return logs;
  }

  async getById(id: string) {
    const log = await FoodStockLog.findById(id)
      .populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!log) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return log;
  }

  async create(logData: Partial<IFoodStockLog>, userId: string) {

    if (!logData.productId) {
      throw new Error('Не указан продукт');
    }
    if (!logData.productName) {
      throw new Error('Не указано название продукта');
    }
    if (!logData.batchNumber) {
      throw new Error('Не указан номер партии');
    }
    if (!logData.expirationDate) {
      throw new Error('Не указана дата истечения срока годности');
    }
    if (logData.quantity === undefined) {
      throw new Error('Не указано количество');
    }
    if (!logData.unit) {
      throw new Error('Не указана единица измерения');
    }
    if (!logData.supplier) {
      throw new Error('Не указан поставщик');
    }
    if (!logData.supplierContact) {
      throw new Error('Не указан контакт поставщика');
    }
    if (!logData.deliveryDate) {
      throw new Error('Не указана дата поставки');
    }
    if (!logData.deliveryPerson) {
      throw new Error('Не указан получатель');
    }
    if (!logData.receiver) {
      throw new Error('Не указан ответственный за получение');
    }
    if (!logData.status) {
      throw new Error('Не указан статус');
    }


    const product = await Product.findById(logData.productId);
    if (!product) {
      throw new Error('Продукт не найден');
    }


    const receiver = await User.findById(logData.receiver);
    if (!receiver) {
      throw new Error('Ответственный не найден');
    }

    const foodStockLogModel = FoodStockLog;
    const log = new foodStockLogModel({
      ...logData,
      receiver: userId
    });

    await log.save();

    const populatedLog = await foodStockLogModel.findById(log._id)
      .populate('productId', 'name')
      .populate('receiver', 'fullName role');

    return populatedLog;
  }

  async update(id: string, data: Partial<IFoodStockLog>) {
    const updatedLog = await FoodStockLog.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!updatedLog) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return updatedLog;
  }

  async delete(id: string) {
    const result = await FoodStockLog.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return { message: 'Запись продуктового склада успешно удалена' };
  }

  async getByProductId(productId: string, filters: { batchNumber?: string, supplier?: string, status?: string, startDate?: string, endDate?: string, expirationStartDate?: string, expirationEndDate?: string, productName?: string, supplierContact?: string }) {
    const filter: any = { productId };

    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;
    if (filters.supplier) filter.supplier = filters.supplier;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplierContact) filter.supplierContact = filters.supplierContact;

    if (filters.startDate || filters.endDate) {
      filter.deliveryDate = {};
      if (filters.startDate) filter.deliveryDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.deliveryDate.$lte = new Date(filters.endDate);
    }

    if (filters.expirationStartDate || filters.expirationEndDate) {
      filter.expirationDate = {};
      if (filters.expirationStartDate) filter.expirationDate.$gte = new Date(filters.expirationStartDate);
      if (filters.expirationEndDate) filter.expirationDate.$lte = new Date(filters.expirationEndDate);
    }

    const logs = await FoodStockLog.find(filter)
      .populate('productId', 'name')
      .populate('receiver', 'fullName role')
      .sort({ deliveryDate: -1 });

    return logs;
  }

  async getByReceiverId(receiverId: string, filters: { productId?: string, batchNumber?: string, supplier?: string, status?: string, startDate?: string, endDate?: string, expirationStartDate?: string, expirationEndDate?: string, productName?: string, supplierContact?: string }) {
    const filter: any = { receiver: receiverId };

    if (filters.productId) filter.productId = filters.productId;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;
    if (filters.supplier) filter.supplier = filters.supplier;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplierContact) filter.supplierContact = filters.supplierContact;

    if (filters.startDate || filters.endDate) {
      filter.deliveryDate = {};
      if (filters.startDate) filter.deliveryDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.deliveryDate.$lte = new Date(filters.endDate);
    }

    if (filters.expirationStartDate || filters.expirationEndDate) {
      filter.expirationDate = {};
      if (filters.expirationStartDate) filter.expirationDate.$gte = new Date(filters.expirationStartDate);
      if (filters.expirationEndDate) filter.expirationDate.$lte = new Date(filters.expirationEndDate);
    }

    const logs = await FoodStockLog.find(filter)
      .populate('productId', 'name')
      .populate('receiver', 'fullName role')
      .sort({ deliveryDate: -1 });

    return logs;
  }

  async getExpiringSoon(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const logs = await FoodStockLog.find({
      expirationDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'disposed' }
    })
      .populate('productId', 'name')
      .populate('receiver', 'fullName role')
      .sort({ expirationDate: 1 });

    return logs;
  }

  async updateStatus(id: string, status: 'received' | 'stored' | 'used' | 'disposed') {
    const log = await FoodStockLog.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!log) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return log;
  }

  async markAsUsed(id: string, usageDate: Date, usagePerson: string) {
    const log = await FoodStockLog.findByIdAndUpdate(
      id,
      {
        status: 'used',
        usageDate,
        usagePerson
      },
      { new: true }
    ).populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!log) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return log;
  }

  async markAsDisposed(id: string, disposalDate: Date, disposalMethod: string) {
    const log = await FoodStockLog.findByIdAndUpdate(
      id,
      {
        status: 'disposed',
        disposalDate,
        disposalMethod
      },
      { new: true }
    ).populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!log) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return log;
  }

  async addNotes(id: string, notes: string) {
    const log = await FoodStockLog.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    ).populate('productId', 'name')
      .populate('receiver', 'fullName role');

    if (!log) {
      throw new Error('Запись продуктового склада не найдена');
    }

    return log;
  }

  async getStatistics() {
    const stats = await FoodStockLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const supplierStats = await FoodStockLog.aggregate([
      {
        $group: {
          _id: '$supplier',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await FoodStockLog.countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      bySupplier: supplierStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}