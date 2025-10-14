import InfectiousDiseasesJournal from './model';
import { IInfectiousDiseasesJournal } from './model';
import User from '../../entities/users/model'; // Using the user model

export class InfectiousDiseasesJournalService {
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, disease?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.disease) filter.disease = filters.disease;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await InfectiousDiseasesJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getById(id: string) {
    const journal = await InfectiousDiseasesJournal.findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись инфекционного заболевания не найдена');
    }
    
    return journal;
  }

  async create(journalData: Partial<IInfectiousDiseasesJournal>, userId: string) {
    // Проверяем обязательные поля
    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (!journalData.disease) {
      throw new Error('Не указано заболевание');
    }
    if (!journalData.symptoms || journalData.symptoms.length === 0) {
      throw new Error('Не указаны симптомы');
    }
    if (!journalData.treatment) {
      throw new Error('Не указано лечение');
    }
    if (!journalData.doctor) {
      throw new Error('Не указан врач');
    }
    
    // Проверяем существование ребенка
    const child = await User.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }
    
    // Проверяем существование врача
    const doctor = await User.findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }
    
    const journal = new InfectiousDiseasesJournal({
      ...journalData,
      doctor: userId // Врач - текущий пользователь
    });
    
    await journal.save();
    
    const populatedJournal = await InfectiousDiseasesJournal.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    return populatedJournal;
  }

  async update(id: string, data: Partial<IInfectiousDiseasesJournal>) {
    const updatedJournal = await InfectiousDiseasesJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!updatedJournal) {
      throw new Error('Запись инфекционного заболевания не найдена');
    }
    
    return updatedJournal;
  }

  async delete(id: string) {
    const result = await InfectiousDiseasesJournal.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись инфекционного заболевания не найдена');
    }
    
    return { message: 'Запись инфекционного заболевания успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, disease?: string, startDate?: string, endDate?: string }) {
    const filter: any = { childId };
    
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.disease) filter.disease = filters.disease;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await InfectiousDiseasesJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, disease?: string, startDate?: string, endDate?: string }) {
    const filter: any = { doctor: doctorId };
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.disease) filter.disease = filters.disease;
    
    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const journals = await InfectiousDiseasesJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const journals = await InfectiousDiseasesJournal.find({
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
    const journal = await InfectiousDiseasesJournal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись инфекционного заболевания не найдена');
    }
    
    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await InfectiousDiseasesJournal.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись инфекционного заболевания не найдена');
    }
    
    return journal;
  }

  async getStatistics() {
    const stats = await InfectiousDiseasesJournal.aggregate([
      {
        $group: {
          _id: '$disease',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const statusStats = await InfectiousDiseasesJournal.aggregate([
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
    
    const total = await InfectiousDiseasesJournal.countDocuments();
    
    return {
      total,
      byDisease: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}