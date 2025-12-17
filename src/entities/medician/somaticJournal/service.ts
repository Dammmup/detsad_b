import SomaticJournal from './model';
import { ISomaticJournal } from './model';
import User from '../../users/model';


let SomaticJournalModel: any = null;
let UserModel: any = null;

const getSomaticJournalModel = () => {
  if (!SomaticJournalModel) {
    SomaticJournalModel = SomaticJournal;
  }
  return SomaticJournalModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User;
  }
  return UserModel;
};

export class SomaticJournalService {
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

    const journals = await SomaticJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await SomaticJournal.findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись соматического журнала не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<ISomaticJournal>, userId: string) {

    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (!journalData.diagnosis) {
      throw new Error('Не указан диагноз');
    }
    if (!journalData.treatment) {
      throw new Error('Не указано лечение');
    }
    if (!journalData.doctor) {
      throw new Error('Не указан врач');
    }


    const child = await User.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }


    const doctor = await User.findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }

    const somaticJournalModel = SomaticJournal;
    const journal = new somaticJournalModel({
      ...journalData,
      doctor: userId
    });

    await journal.save();

    const populatedJournal = await somaticJournalModel.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    return populatedJournal;
  }

  async update(id: string, data: Partial<ISomaticJournal>) {
    const updatedJournal = await SomaticJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!updatedJournal) {
      throw new Error('Запись соматического журнала не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await SomaticJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись соматического журнала не найдена');
    }

    return { message: 'Запись соматического журнала успешно удалена' };
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

    const journals = await SomaticJournal.find(filter)
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

    const journals = await SomaticJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const journals = await SomaticJournal.find({
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
    const journal = await SomaticJournal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись соматического журнала не найдена');
    }

    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await SomaticJournal.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись соматического журнала не найдена');
    }

    return journal;
  }

  async getStatistics() {
    const stats = await SomaticJournal.aggregate([
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

    const total = await SomaticJournal.countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}