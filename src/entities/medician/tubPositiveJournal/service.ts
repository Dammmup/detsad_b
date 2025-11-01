import TubPositiveJournal from './model';
import { ITubPositiveJournal } from './model';
import User from '../../../entities/users/model'; // Using the user model

// Модели будут вызываться при каждом использовании, чтобы убедиться, что соединение установлено
const getTubPositiveJournalModel = () => TubPositiveJournal();
const getUserModel = () => User();

export class TubPositiveJournalService {
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await getTubPositiveJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getById(id: string) {
    const journal = await getTubPositiveJournalModel().findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись туберкулеза не найдена');
    }
    
    return journal;
  }

  async create(journalData: Partial<ITubPositiveJournal>, userId: string) {
    // Проверяем обязательные поля
    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (!journalData.result) {
      throw new Error('Не указан результат');
    }
    if (!journalData.doctor) {
      throw new Error('Не указан врач');
    }
    
    // Проверяем существование ребенка
    const child = await getUserModel().findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }
    
    // Проверяем существование врача
    const doctor = await getUserModel().findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }
    
    const journal = new (getTubPositiveJournalModel())({
      ...journalData,
      doctor: userId // Врач - текущий пользователь
    });
    
    await journal.save();
    
    const populatedJournal = await getTubPositiveJournalModel().findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    return populatedJournal;
  }

  async update(id: string, data: Partial<ITubPositiveJournal>) {
    const updatedJournal = await getTubPositiveJournalModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!updatedJournal) {
      throw new Error('Запись туберкулеза не найдена');
    }
    
    return updatedJournal;
  }

  async delete(id: string) {
    const result = await getTubPositiveJournalModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись туберкулеза не найдена');
    }
    
    return { message: 'Запись туберкулеза успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, startDate?: string, endDate?: string }) {
    const filter: any = { childId };
    
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await getTubPositiveJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, startDate?: string, endDate?: string }) {
    const filter: any = { doctor: doctorId };
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    
    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await getTubPositiveJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const journals = await getTubPositiveJournalModel().find({
      nextAppointmentDate: {
        $gte: today,
        $lte: futureDate
      }
    })
    .populate('childId', 'fullName iin')
    .populate('doctor', 'fullName role')
    .sort({ nextAppointmentDate: 1 });
    
    return journals;
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'reviewed') {
    const journal = await getTubPositiveJournalModel().findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись туберкулеза не найдена');
    }
    
    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await getTubPositiveJournalModel().findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись туберкулеза не найдена');
    }
    
    return journal;
  }

  async getStatistics() {
    const stats = await getTubPositiveJournalModel().aggregate([
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
    
    const total = await getTubPositiveJournalModel().countDocuments();
    
    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}