import { IHelminthJournal } from './model';
import { getModel } from '../../../config/modelRegistry';

export class HelminthJournalService {
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, startDate?: string, endDate?: string }) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
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

    const journals = await HelminthJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const journal = await HelminthJournal.findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись гельминтов не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IHelminthJournal>, userId: string) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const User = getModel<any>('User');


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


    const child = await User.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }


    const doctor = await User.findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }

    const journal = new HelminthJournal({
      ...journalData,
      doctor: userId
    });

    await journal.save();

    const populatedJournal = await HelminthJournal.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IHelminthJournal>) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const updatedJournal = await HelminthJournal.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!updatedJournal) {
      throw new Error('Запись гельминтов не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const result = await HelminthJournal.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись гельминтов не найдена');
    }

    return { message: 'Запись гельминтов успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, startDate?: string, endDate?: string }) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
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

    const journals = await HelminthJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, startDate?: string, endDate?: string }) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const filter: any = { doctor: doctorId };

    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;

    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await HelminthJournal.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const journals = await HelminthJournal.find({
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
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const journal = await HelminthJournal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись гельминтов не найдена');
    }

    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const journal = await HelminthJournal.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись гельминтов не найдена');
    }

    return journal;
  }

  async getStatistics() {
    const HelminthJournal = getModel<IHelminthJournal>('HelminthJournal');
    const stats = await HelminthJournal.aggregate([
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

    const total = await HelminthJournal.countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}