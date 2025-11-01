import ContactInfectionJournal from './model';
import { IContactInfectionJournal } from './model';
import User from '../../users/model'; // Using the user model

export class ContactInfectionJournalService {
  private get journalModel() {
    return ContactInfectionJournal();
  }
  
  private get userModel() {
    return User();
  }
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, infectionType?: string, startDate?: string, endDate?: string, nextAppointmentDate?: string, isolationEndDate?: string, contactsTraced?: boolean }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.infectionType) filter.infectionType = filters.infectionType;
    if (filters.contactsTraced !== undefined) filter.contactsTraced = filters.contactsTraced;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAppointmentDate) {
      filter.nextAppointmentDate = new Date(filters.nextAppointmentDate);
    }
    
    if (filters.isolationEndDate) {
      filter.isolationEndDate = new Date(filters.isolationEndDate);
    }
    
    const journals = await this.journalModel.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getById(id: string) {
    const journal = await this.journalModel.findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return journal;
  }

  async create(journalData: Partial<IContactInfectionJournal>, userId: string) {
    // Проверяем обязательные поля
    if (!journalData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!journalData.date) {
      throw new Error('Не указана дата');
    }
    if (!journalData.infectionType) {
      throw new Error('Не указан тип инфекции');
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
    const child = await this.userModel.findById(journalData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }
    
    // Проверяем существование врача
    const doctor = await this.userModel.findById(journalData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }
    
    // Рассчитываем дату окончания изоляции, если указан период изоляции
    if (journalData.isolationPeriod) {
      const isolationEndDate = new Date(journalData.date as Date);
      isolationEndDate.setDate(isolationEndDate.getDate() + journalData.isolationPeriod);
      journalData.isolationEndDate = isolationEndDate;
    }
    
    const journal = new this.journalModel({
      ...journalData,
      doctor: userId // Врач - текущий пользователь
    });
    
    await journal.save();
    
    const populatedJournal = await this.journalModel.findById(journal._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    return populatedJournal;
  }

  async update(id: string, data: Partial<IContactInfectionJournal>) {
    // Рассчитываем дату окончания изоляции, если указан период изоляции
    if (data.isolationPeriod !== undefined) {
      const journal = await this.journalModel.findById(id);
      if (journal && journal.date) {
        const isolationEndDate = new Date(journal.date);
        isolationEndDate.setDate(isolationEndDate.getDate() + data.isolationPeriod);
        data.isolationEndDate = isolationEndDate;
      }
    }
    
    const updatedJournal = await this.journalModel.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!updatedJournal) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return updatedJournal;
  }

  async delete(id: string) {
    const result = await this.journalModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return { message: 'Запись контактной инфекции успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, infectionType?: string, startDate?: string, endDate?: string, nextAppointmentDate?: string, isolationEndDate?: string, contactsTraced?: boolean }) {
    const filter: any = { childId };
    
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.infectionType) filter.infectionType = filters.infectionType;
    if (filters.contactsTraced !== undefined) filter.contactsTraced = filters.contactsTraced;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAppointmentDate) {
      filter.nextAppointmentDate = new Date(filters.nextAppointmentDate);
    }
    
    if (filters.isolationEndDate) {
      filter.isolationEndDate = new Date(filters.isolationEndDate);
    }
    
    const journals = await this.journalModel.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, infectionType?: string, startDate?: string, endDate?: string, nextAppointmentDate?: string, isolationEndDate?: string, contactsTraced?: boolean }) {
    const filter: any = { doctor: doctorId };
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.infectionType) filter.infectionType = filters.infectionType;
    if (filters.contactsTraced !== undefined) filter.contactsTraced = filters.contactsTraced;
    
    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAppointmentDate) {
      filter.nextAppointmentDate = new Date(filters.nextAppointmentDate);
    }
    
    if (filters.isolationEndDate) {
      filter.isolationEndDate = new Date(filters.isolationEndDate);
    }
    
    const journals = await this.journalModel.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return journals;
  }

  async getUpcomingAppointments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const journals = await this.journalModel.find({
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
    const journal = await this.journalModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return journal;
  }

  async addRecommendations(id: string, recommendations: string) {
    const journal = await this.journalModel.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return journal;
  }

  async traceContacts(id: string) {
    const journal = await this.journalModel.findByIdAndUpdate(
      id,
      { contactsTraced: true },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!journal) {
      throw new Error('Запись контактной инфекции не найдена');
    }
    
    return journal;
  }

  async getStatistics() {
    const stats = await this.journalModel.aggregate([
      {
        $group: {
          _id: '$infectionType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const tracedStats = await this.journalModel.aggregate([
      {
        $group: {
          _id: '$contactsTraced',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await this.journalModel.countDocuments();
    
    return {
      total,
      byInfectionType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byContactsTraced: tracedStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}