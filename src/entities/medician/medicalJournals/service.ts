import MedicalJournal from './model';
import { IMedicalJournal } from './model';

// Отложенное создание модели
let MedicalJournalModel: any = null;

const getMedicalJournalModel = () => {
  if (!MedicalJournalModel) {
    MedicalJournalModel = MedicalJournal();
  }
 return MedicalJournalModel;
};

export class MedicalJournalsService {
  async getAll(filters: { childId?: string, type?: string, doctorId?: string, status?: string, fromDate?: string, toDate?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.type) filter.type = filters.type;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    
    if (filters.fromDate || filters.toDate) {
      filter.date = {};
      if (filters.fromDate) filter.date.$gte = new Date(filters.fromDate);
      if (filters.toDate) filter.date.$lte = new Date(filters.toDate);
    }
    
    const journals = await getMedicalJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getById(id: string) {
    const journal = await getMedicalJournalModel().findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Медицинская запись не найдена');
    }
    
    return journal;
  }

  async create(journalData: Partial<IMedicalJournal>) {
    // Проверяем обязательные поля
    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.type) {
      throw new Error('Не указан тип записи');
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
    
    const medicalJournalModel = getMedicalJournalModel();
    const journal = new medicalJournalModel(journalData);
    await journal.save();
    
    const populatedJournal = await medicalJournalModel.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    return populatedJournal;
  }

  async update(id: string, data: Partial<IMedicalJournal>) {
    const updatedJournal = await getMedicalJournalModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!updatedJournal) {
      throw new Error('Медицинская запись не найдена');
    }
    
    return updatedJournal;
  }

  async delete(id: string) {
    const result = await getMedicalJournalModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Медицинская запись не найдена');
    }
    
    return { message: 'Медицинская запись успешно удалена' };
  }

  async getByChildAndType(childId: string, type: string) {
    const journals = await getMedicalJournalModel().find({ childId, type })
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const journals = await getMedicalJournalModel().find({
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
    const journal = await getMedicalJournalModel().findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Медицинская запись не найдена');
    }
    
    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await getMedicalJournalModel().findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Медицинская запись не найдена');
    }
    
    return journal;
  }

  async getStatistics() {
    const stats = await getMedicalJournalModel().aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await getMedicalJournalModel().countDocuments();
    
    return {
      total,
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}