import ChildHealthPassport from './model';
import { IChildHealthPassport } from './model';
import User from '../auth/model'; // Using the user model

export class ChildHealthPassportService {
  async getAll(filters: { childId?: string, status?: string, bloodType?: string, rhesusFactor?: string, startDate?: string, endDate?: string, nextExaminationDate?: string, vaccinationDate?: string, doctorExaminationDate?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.bloodType) filter.bloodType = filters.bloodType;
    if (filters.rhesusFactor) filter.rhesusFactor = filters.rhesusFactor;
    
    if (filters.nextExaminationDate) {
      filter.nextExaminationDate = new Date(filters.nextExaminationDate);
    } else if (filters.startDate || filters.endDate) {
      filter.nextExaminationDate = {};
      if (filters.startDate) filter.nextExaminationDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.nextExaminationDate.$lte = new Date(filters.endDate);
    }
    
    if (filters.vaccinationDate) {
      filter['vaccinationHistory.date'] = new Date(filters.vaccinationDate);
    }
    
    if (filters.doctorExaminationDate) {
      filter['doctorExaminations.date'] = new Date(filters.doctorExaminationDate);
    }
    
    const passports = await ChildHealthPassport.find(filter)
      .populate('childId', 'fullName iin')
      .sort({ nextExaminationDate: -1 });
    
    return passports;
  }

  async getById(id: string) {
    const passport = await ChildHealthPassport.findById(id)
      .populate('childId', 'fullName iin');
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    return passport;
  }

  async create(passportData: Partial<IChildHealthPassport>, userId: string) {
    // Проверяем обязательные поля
    if (!passportData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!passportData.birthDate) {
      throw new Error('Не указана дата рождения');
    }
    if (!passportData.birthPlace) {
      throw new Error('Не указано место рождения');
    }
    if (!passportData.bloodType) {
      throw new Error('Не указана группа крови');
    }
    if (!passportData.rhesusFactor) {
      throw new Error('Не указан резус-фактор');
    }
    
    // Проверяем существование ребенка
    const child = await User.findById(passportData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }
    
    const passport = new ChildHealthPassport({
      ...passportData,
      childId: userId // Ребенок - текущий пользователь
    });
    
    await passport.save();
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async update(id: string, data: Partial<IChildHealthPassport>) {
    const updatedPassport = await ChildHealthPassport.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin');
    
    if (!updatedPassport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    return updatedPassport;
  }

  async delete(id: string) {
    const result = await ChildHealthPassport.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    return { message: 'Медицинский паспорт ребенка успешно удален' };
  }

  async getByChildId(childId: string, filters: { status?: string, bloodType?: string, rhesusFactor?: string, startDate?: string, endDate?: string, nextExaminationDate?: string, vaccinationDate?: string, doctorExaminationDate?: string }) {
    const filter: any = { childId };
    
    if (filters.status) filter.status = filters.status;
    if (filters.bloodType) filter.bloodType = filters.bloodType;
    if (filters.rhesusFactor) filter.rhesusFactor = filters.rhesusFactor;
    
    if (filters.nextExaminationDate) {
      filter.nextExaminationDate = new Date(filters.nextExaminationDate);
    } else if (filters.startDate || filters.endDate) {
      filter.nextExaminationDate = {};
      if (filters.startDate) filter.nextExaminationDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.nextExaminationDate.$lte = new Date(filters.endDate);
    }
    
    if (filters.vaccinationDate) {
      filter['vaccinationHistory.date'] = new Date(filters.vaccinationDate);
    }
    
    if (filters.doctorExaminationDate) {
      filter['doctorExaminations.date'] = new Date(filters.doctorExaminationDate);
    }
    
    const passports = await ChildHealthPassport.find(filter)
      .populate('childId', 'fullName iin')
      .sort({ nextExaminationDate: -1 });
    
    return passports;
  }

  async addVaccination(id: string, vaccination: { vaccine: string, date: Date, nextDate?: Date, notes?: string }) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    passport.vaccinationHistory.push(vaccination);
    await passport.save();
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addDoctorExamination(id: string, examination: { doctor: string, date: Date, result: string, notes?: string }) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    passport.doctorExaminations.push(examination);
    await passport.save();
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addChronicDisease(id: string, disease: string) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    if (!passport.chronicDiseases.includes(disease)) {
      passport.chronicDiseases.push(disease);
      await passport.save();
    }
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addAllergy(id: string, allergy: string) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    if (!passport.allergies.includes(allergy)) {
      passport.allergies.push(allergy);
      await passport.save();
    }
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async removeChronicDisease(id: string, disease: string) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    passport.chronicDiseases = passport.chronicDiseases.filter(d => d !== disease);
    await passport.save();
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async removeAllergy(id: string, allergy: string) {
    const passport = await ChildHealthPassport.findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    passport.allergies = passport.allergies.filter(a => a !== allergy);
    await passport.save();
    
    const populatedPassport = await ChildHealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async getUpcomingExaminations(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const passports = await ChildHealthPassport.find({
      nextExaminationDate: {
        $gte: today,
        $lte: futureDate
      }
    })
    .populate('childId', 'fullName iin')
    .sort({ nextExaminationDate: 1 });
    
    return passports;
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'archived') {
    const passport = await ChildHealthPassport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin');
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    return passport;
  }

  async addRecommendations(id: string, recommendations: string) {
    const passport = await ChildHealthPassport.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin');
    
    if (!passport) {
      throw new Error('Медицинский паспорт ребенка не найден');
    }
    
    return passport;
  }

  async getStatistics() {
    const stats = await ChildHealthPassport.aggregate([
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
    
    const bloodTypeStats = await ChildHealthPassport.aggregate([
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const rhesusStats = await ChildHealthPassport.aggregate([
      {
        $group: {
          _id: '$rhesusFactor',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await ChildHealthPassport.countDocuments();
    
    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byBloodType: bloodTypeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byRhesus: rhesusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}