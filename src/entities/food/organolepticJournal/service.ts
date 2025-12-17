import OrganolepticJournal from './model';
import { IOrganolepticJournal } from './model';
import User from '../../users/model';


let OrganolepticJournalModel: any = null;
let UserModel: any = null;

const getOrganolepticJournalModel = () => {
  if (!OrganolepticJournalModel) {
    OrganolepticJournalModel = OrganolepticJournal;
  }
  return OrganolepticJournalModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User;
  }
  return UserModel;
};

export class OrganolepticJournalService {
  async getAll(filters: { childId?: string, date?: string, inspectorId?: string, status?: string, productName?: string, supplier?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};

    if (filters.childId) filter.childId = filters.childId;
    if (filters.inspectorId) filter.inspector = filters.inspectorId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplier) filter.supplier = filters.supplier;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await OrganolepticJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await OrganolepticJournal.findById(id)
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role');

    if (!journal) {
      throw new Error('Запись органолептического контроля не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IOrganolepticJournal>, userId: string) {

    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (!journalData.productName) {
      throw new Error('Не указано название продукта');
    }
    if (!journalData.appearance) {
      throw new Error('Не указан внешний вид');
    }
    if (!journalData.color) {
      throw new Error('Не указан цвет');
    }
    if (!journalData.smell) {
      throw new Error('Не указан запах');
    }
    if (!journalData.taste) {
      throw new Error('Не указан вкус');
    }
    if (journalData.temperature === undefined) {
      throw new Error('Не указана температура');
    }
    if (!journalData.consistency) {
      throw new Error('Не указана консистенция');
    }
    if (!journalData.packagingCondition) {
      throw new Error('Не указано состояние упаковки');
    }
    if (!journalData.expirationDate) {
      throw new Error('Не указана дата истечения срока годности');
    }
    if (!journalData.batchNumber) {
      throw new Error('Не указан номер партии');
    }
    if (!journalData.supplier) {
      throw new Error('Не указан поставщик');
    }
    if (journalData.quantity === undefined) {
      throw new Error('Не указано количество');
    }
    if (!journalData.unit) {
      throw new Error('Не указана единица измерения');
    }
    if (!journalData.inspector) {
      throw new Error('Не указан инспектор');
    }


    const child = await User.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }


    const inspector = await User.findById(journalData.inspector);
    if (!inspector) {
      throw new Error('Инспектор не найден');
    }

    const organolepticModel = OrganolepticJournal;
    const journal = new organolepticModel({
      ...journalData,
      inspector: userId
    });

    await journal.save();

    const populatedJournal = await organolepticModel.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IOrganolepticJournal>) {
    const updatedJournal = await OrganolepticJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role');

    if (!updatedJournal) {
      throw new Error('Запись органолептического контроля не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await OrganolepticJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись органолептического контроля не найдена');
    }

    return { message: 'Запись органолептического контроля успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, inspectorId?: string, status?: string, productName?: string, supplier?: string, startDate?: string, endDate?: string }) {
    const filter: any = { childId };

    if (filters.inspectorId) filter.inspector = filters.inspectorId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplier) filter.supplier = filters.supplier;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await OrganolepticJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getByInspectorId(inspectorId: string, filters: { childId?: string, status?: string, productName?: string, supplier?: string, startDate?: string, endDate?: string }) {
    const filter: any = { inspector: inspectorId };

    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.supplier) filter.supplier = filters.supplier;

    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await OrganolepticJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getUpcomingInspections(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const journals = await OrganolepticJournal.find({
      nextInspectionDate: {
        $gte: today,
        $lte: futureDate
      }
    })
      .populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role')
      .sort({ nextInspectionDate: 1 });

    return journals;
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'reviewed') {
    const journal = await OrganolepticJournal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role');

    if (!journal) {
      throw new Error('Запись органолептического контроля не найдена');
    }

    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await OrganolepticJournal.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('inspector', 'fullName role');

    if (!journal) {
      throw new Error('Запись органолептического контроля не найдена');
    }

    return journal;
  }

  async getStatistics() {
    const stats = await OrganolepticJournal.aggregate([
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

    const productStats = await OrganolepticJournal.aggregate([
      {
        $group: {
          _id: '$productName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const supplierStats = await OrganolepticJournal.aggregate([
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

    const total = await OrganolepticJournal.countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byProduct: productStats.reduce((acc, stat) => {
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