import createHealthPassportModel from './model';
import { IHealthPassport } from './model';

// Отложенное создание модели
let HealthPassportModel: any = null;

const getHealthPassportModel = () => {
  if (!HealthPassportModel) {
    HealthPassportModel = createHealthPassportModel();
  }
  return HealthPassportModel;
};

export class HealthPassportService {
  async getAll(filters: { childId?: string, status?: string, bloodType?: string, rhesus?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.bloodType) filter.bloodType = filters.bloodType;
    if (filters.rhesus) filter.rhesus = filters.rhesus;
    
    const passports = await getHealthPassportModel().find(filter)
      .populate('childId', 'fullName iin')
      .sort({ createdAt: -1 });

    return passports;
  }

  async getById(id: string) {
    const passport = await getHealthPassportModel().findById(id)
      .populate('childId', 'fullName iin');
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    return passport;
  }

  async getByChildId(childId: string) {
    const passport = await getHealthPassportModel().findOne({ childId })
      .populate('childId', 'fullName iin');
    
    return passport;
  }

  async create(passportData: Partial<IHealthPassport>) {
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
    if (!passportData.rhesus) {
      throw new Error('Не указан резус-фактор');
    }
    
    // Проверяем, существует ли уже паспорт для этого ребенка
    const existingPassport = await getHealthPassportModel().findOne({ childId: passportData.childId });
    if (existingPassport) {
      throw new Error('Медицинский паспорт для этого ребенка уже существует');
    }

    const passport = new (getHealthPassportModel())(passportData);
    await passport.save();

    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async update(id: string, data: Partial<IHealthPassport>) {
    const updatedPassport = await getHealthPassportModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin');
    
    if (!updatedPassport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    return updatedPassport;
  }

  async delete(id: string) {
    const result = await getHealthPassportModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    return { message: 'Медицинский паспорт успешно удален' };
  }

  async addVaccination(id: string, vaccination: { vaccine: string, date: Date, nextDate?: Date, notes?: string }) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    passport.vaccinationHistory.push(vaccination);
    await passport.save();
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addDoctorExamination(id: string, examination: { doctor: string, date: Date, result: string, notes?: string }) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    passport.doctorExaminations.push(examination);
    await passport.save();
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addChronicDisease(id: string, disease: string) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    if (!passport.chronicDiseases.includes(disease)) {
      passport.chronicDiseases.push(disease);
      await passport.save();
    }
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async addAllergy(id: string, allergy: string) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    if (!passport.allergies.includes(allergy)) {
      passport.allergies.push(allergy);
      await passport.save();
    }
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async removeChronicDisease(id: string, disease: string) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    passport.chronicDiseases = passport.chronicDiseases.filter(d => d !== disease);
    await passport.save();
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async removeAllergy(id: string, allergy: string) {
    const passport = await getHealthPassportModel().findById(id);
    
    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }
    
    passport.allergies = passport.allergies.filter(a => a !== allergy);
    await passport.save();
    
    const populatedPassport = await getHealthPassportModel().findById(passport._id)
      .populate('childId', 'fullName iin');
    
    return populatedPassport;
  }

  async getUpcomingVaccinations(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const passports = await getHealthPassportModel().find({
      'vaccinationHistory.nextDate': {
        $gte: today,
        $lte: futureDate
      }
    })
    .populate('childId', 'fullName iin')
    .sort({ 'vaccinationHistory.nextDate': 1 });
    
    // Фильтруем записи с предстоящими прививками
    const upcomingVaccinations: any[] = [];
    
    passports.forEach(passport => {
      passport.vaccinationHistory.forEach(vaccination => {
        if (vaccination.nextDate && 
            vaccination.nextDate >= today && 
            vaccination.nextDate <= futureDate) {
          upcomingVaccinations.push({
            childId: passport.childId,
            childName: (passport.childId as any).fullName,
            vaccine: vaccination.vaccine,
            date: vaccination.nextDate,
            notes: vaccination.notes
          });
        }
      });
    });
    
    return upcomingVaccinations.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getStatistics() {
    const stats = await getHealthPassportModel().aggregate([
      {
        $group: {
          _id: {
            bloodType: '$bloodType',
            rhesus: '$rhesus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await getHealthPassportModel().countDocuments();
    
    return {
      total,
      byBloodType: stats.reduce((acc, stat) => {
        const key = `${stat._id.bloodType}_${stat._id.rhesus}`;
        acc[key] = stat.count;
        return acc;
      }, {})
    };
  }
}