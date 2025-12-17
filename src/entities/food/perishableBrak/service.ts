import PerishableBrak from './model';
import { IPerishableBrak } from './model';
import User from '../../users/model';
import createProductModel from '../products/model';


let PerishableBrakModel: any = null;
let UserModel: any = null;

const getPerishableBrakModel = () => {
  if (!PerishableBrakModel) {
    PerishableBrakModel = PerishableBrak();
  }
  return PerishableBrakModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User();
  }
  return UserModel;
};


let ProductModel: any = null;

const getProductModel = () => {
  if (!ProductModel) {
    ProductModel = createProductModel();
  }
  return ProductModel;
};
export class PerishableBrakService {
  async getAll(filters: { productId?: string, inspectorId?: string, status?: string, startDate?: string, endDate?: string, disposalStartDate?: string, disposalEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = {};

    if (filters.productId) filter.productId = filters.productId;
    if (filters.inspectorId) filter.inspector = filters.inspectorId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.inspectionDate = {};
      if (filters.startDate) filter.inspectionDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.inspectionDate.$lte = new Date(filters.endDate);
    }

    if (filters.disposalStartDate || filters.disposalEndDate) {
      filter.disposalDate = {};
      if (filters.disposalStartDate) filter.disposalDate.$gte = new Date(filters.disposalStartDate);
      if (filters.disposalEndDate) filter.disposalDate.$lte = new Date(filters.disposalEndDate);
    }

    const braks = await getPerishableBrakModel().find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role')
      .sort({ inspectionDate: -1 });

    return braks;
  }

  async getById(id: string) {
    const brak = await getPerishableBrakModel().findById(id)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    if (!brak) {
      throw new Error('Запись брака не найдена');
    }

    return brak;
  }

  async create(brakData: Partial<IPerishableBrak>, userId: string) {

    if (!brakData.productId) {
      throw new Error('Не указан продукт');
    }
    if (!brakData.productName) {
      throw new Error('Не указано название продукта');
    }
    if (!brakData.batchNumber) {
      throw new Error('Не указан номер партии');
    }
    if (!brakData.expirationDate) {
      throw new Error('Не указана дата истечения срока годности');
    }
    if (brakData.quantity === undefined) {
      throw new Error('Не указано количество');
    }
    if (!brakData.unit) {
      throw new Error('Не указана единица измерения');
    }
    if (!brakData.reason) {
      throw new Error('Не указана причина');
    }
    if (!brakData.inspector) {
      throw new Error('Не указан инспектор');
    }
    if (!brakData.inspectionDate) {
      throw new Error('Не указана дата проверки');
    }
    if (!brakData.disposalMethod) {
      throw new Error('Не указан метод утилизации');
    }


    const product = await getProductModel().findById(brakData.productId);
    if (!product) {
      throw new Error('Продукт не найден');
    }


    const inspector = await getUserModel().findById(brakData.inspector);
    if (!inspector) {
      throw new Error('Инспектор не найден');
    }

    const perishableBrakModel = getPerishableBrakModel();
    const brak = new perishableBrakModel({
      ...brakData,
      inspector: userId
    });

    await brak.save();

    const populatedBrak = await perishableBrakModel.findById(brak._id)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    return populatedBrak;
  }

  async update(id: string, data: Partial<IPerishableBrak>) {
    const updatedBrak = await getPerishableBrakModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    if (!updatedBrak) {
      throw new Error('Запись брака не найдена');
    }

    return updatedBrak;
  }

  async delete(id: string) {
    const result = await getPerishableBrakModel().findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись брака не найдена');
    }

    return { message: 'Запись брака успешно удалена' };
  }

  async getByProductId(productId: string, filters: { inspectorId?: string, status?: string, startDate?: string, endDate?: string, disposalStartDate?: string, disposalEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = { productId };

    if (filters.inspectorId) filter.inspector = filters.inspectorId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.inspectionDate = {};
      if (filters.startDate) filter.inspectionDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.inspectionDate.$lte = new Date(filters.endDate);
    }

    if (filters.disposalStartDate || filters.disposalEndDate) {
      filter.disposalDate = {};
      if (filters.disposalStartDate) filter.disposalDate.$gte = new Date(filters.disposalStartDate);
      if (filters.disposalEndDate) filter.disposalDate.$lte = new Date(filters.disposalEndDate);
    }

    const braks = await getPerishableBrakModel().find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role')
      .sort({ inspectionDate: -1 });

    return braks;
  }

  async getByInspectorId(inspectorId: string, filters: { productId?: string, status?: string, startDate?: string, endDate?: string, disposalStartDate?: string, disposalEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = { inspector: inspectorId };

    if (filters.productId) filter.productId = filters.productId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.inspectionDate = {};
      if (filters.startDate) filter.inspectionDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.inspectionDate.$lte = new Date(filters.endDate);
    }

    if (filters.disposalStartDate || filters.disposalEndDate) {
      filter.disposalDate = {};
      if (filters.disposalStartDate) filter.disposalDate.$gte = new Date(filters.disposalStartDate);
      if (filters.disposalEndDate) filter.disposalDate.$lte = new Date(filters.disposalEndDate);
    }

    const braks = await getPerishableBrakModel().find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role')
      .sort({ inspectionDate: -1 });

    return braks;
  }

  async getExpiredProducts(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const braks = await getPerishableBrakModel().find({
      expirationDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'disposed' }
    })
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role')
      .sort({ expirationDate: 1 });

    return braks;
  }

  async markAsDisposed(id: string, disposedBy: string, disposalDate?: Date) {
    const brak = await getPerishableBrakModel().findById(id);

    if (!brak) {
      throw new Error('Запись брака не найдена');
    }


    if (brak.inspector.toString() !== disposedBy && brak.disposedBy?.toString() !== disposedBy) {
      throw new Error('Нет прав для отметки утилизации этой записи');
    }


    brak.status = 'disposed';
    brak.disposalDate = disposalDate || new Date();
    brak.disposedBy = disposedBy as any;

    await brak.save();

    const populatedBrak = await getPerishableBrakModel().findById(brak._id)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    return populatedBrak;
  }

  async updateStatus(id: string, status: 'pending' | 'disposed' | 'reviewed') {
    const brak = await getPerishableBrakModel().findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    if (!brak) {
      throw new Error('Запись брака не найдена');
    }

    return brak;
  }

  async addRecommendations(id: string, recommendations: string) {
    const brak = await getPerishableBrakModel().findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('disposedBy', 'fullName role');

    if (!brak) {
      throw new Error('Запись брака не найдена');
    }

    return brak;
  }

  async getStatistics() {
    const stats = await getPerishableBrakModel().aggregate([
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

    const reasonStats = await getPerishableBrakModel().aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const disposalMethodStats = await getPerishableBrakModel().aggregate([
      {
        $group: {
          _id: '$disposalMethod',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await getPerishableBrakModel().countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byReason: reasonStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byDisposalMethod: disposalMethodStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}