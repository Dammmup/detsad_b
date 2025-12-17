import MantouxJournal from './model';
import { IMantouxJournal } from './model';
import User from '../../users/model';


const getMantouxJournalModel = () => MantouxJournal();
const getUserModel = () => User();

export class MantouxJournalService {
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, reactionType?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};

    if (filters.childId) filter.childId = filters.childId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.reactionType) filter.reactionType = filters.reactionType;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await getMantouxJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getById(id: string) {
    const journal = await getMantouxJournalModel().findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись манту не найдена');
    }

    return journal;
  }

  async create(journalData: Partial<IMantouxJournal>, userId: string) {

    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (journalData.reactionSize === undefined) {
      throw new Error('Не указан размер реакции');
    }
    if (!journalData.reactionType) {
      throw new Error('Не указан тип реакции');
    }
    if (!journalData.injectionSite) {
      throw new Error('Не указано место инъекции');
    }
    if (!journalData.doctor) {
      throw new Error('Не указан врач');
    }


    const child = await getUserModel().findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }


    const doctor = await getUserModel().findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }

    const journal = new (getMantouxJournalModel())({
      ...journalData,
      doctor: userId
    });

    await journal.save();

    const populatedJournal = await getMantouxJournalModel().findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    return populatedJournal;
  }

  async update(id: string, data: Partial<IMantouxJournal>) {
    const updatedJournal = await getMantouxJournalModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!updatedJournal) {
      throw new Error('Запись манту не найдена');
    }

    return updatedJournal;
  }

  async delete(id: string) {
    const result = await getMantouxJournalModel().findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись манту не найдена');
    }

    return { message: 'Запись манту успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, reactionType?: string, startDate?: string, endDate?: string }) {
    const filter: any = { childId };

    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.reactionType) filter.reactionType = filters.reactionType;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await getMantouxJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, reactionType?: string, startDate?: string, endDate?: string }) {
    const filter: any = { doctor: doctorId };

    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.reactionType) filter.reactionType = filters.reactionType;

    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const journals = await getMantouxJournalModel().find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });

    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const journals = await getMantouxJournalModel().find({
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
    const journal = await getMantouxJournalModel().findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись манту не найдена');
    }

    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await getMantouxJournalModel().findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');

    if (!journal) {
      throw new Error('Запись манту не найдена');
    }

    return journal;
  }

  async getStatistics() {
    const stats = await getMantouxJournalModel().aggregate([
      {
        $group: {
          _id: '$reactionType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await getMantouxJournalModel().countDocuments();

    return {
      total,
      byReactionType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}