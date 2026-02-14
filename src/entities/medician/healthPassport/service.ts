import HealthPassport, { IHealthPassport } from './model';


export class HealthPassportService {
  async getAll(filters: { childId?: string, status?: string, bloodType?: string, rhesus?: string }) {
    const filter: any = {};

    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.bloodType) filter.bloodType = filters.bloodType;
    if (filters.rhesus) filter.rhesus = filters.rhesus;

    const passports = await HealthPassport.find(filter)
      .populate('childId', 'fullName iin')
      .sort({ createdAt: -1 });

    return passports;
  }

  async getById(id: string) {
    const passport = await HealthPassport.findById(id)
      .populate('childId', 'fullName iin');

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    return passport;
  }

  async getByChildId(childId: string) {
    const passport = await HealthPassport.findOne({ childId })
      .populate('childId', 'fullName iin');

    return passport;
  }

  async create(passportData: Partial<IHealthPassport>) {

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


    const existingPassport = await HealthPassport.findOne({ childId: passportData.childId });
    if (existingPassport) {
      throw new Error('Медицинский паспорт для этого ребенка уже существует');
    }

    const passport = new HealthPassport(passportData);
    await passport.save();

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async update(id: string, data: Partial<IHealthPassport>) {
    const updatedPassport = await HealthPassport.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('childId', 'fullName iin');

    if (!updatedPassport) {
      throw new Error('Медицинский паспорт не найден');
    }

    return updatedPassport;
  }

  async delete(id: string) {
    const result = await HealthPassport.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Медицинский паспорт не найден');
    }

    return { message: 'Медицинский паспорт успешно удален' };
  }

  async addVaccination(id: string, vaccination: { vaccine: string, date: Date, nextDate?: Date, notes?: string }) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    passport.vaccinationHistory.push(vaccination);
    await passport.save();

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async addDoctorExamination(id: string, examination: { doctor: string, date: Date, result: string, notes?: string }) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    passport.doctorExaminations.push(examination);
    await passport.save();

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async addChronicDisease(id: string, disease: string) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    if (!passport.chronicDiseases.includes(disease)) {
      passport.chronicDiseases.push(disease);
      await passport.save();
    }

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async addAllergy(id: string, allergy: string) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    if (!passport.allergies.includes(allergy)) {
      passport.allergies.push(allergy);
      await passport.save();
    }

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async removeChronicDisease(id: string, disease: string) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    passport.chronicDiseases = passport.chronicDiseases.filter(d => d !== disease);
    await passport.save();

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async removeAllergy(id: string, allergy: string) {
    const passport = await HealthPassport.findById(id);

    if (!passport) {
      throw new Error('Медицинский паспорт не найден');
    }

    passport.allergies = passport.allergies.filter(a => a !== allergy);
    await passport.save();

    const populatedPassport = await HealthPassport.findById(passport._id)
      .populate('childId', 'fullName iin');

    return populatedPassport;
  }

  async getUpcomingVaccinations(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const passports = await HealthPassport.find({
      'vaccinationHistory.nextDate': {
        $gte: today,
        $lte: futureDate
      }
    })
      .populate('childId', 'fullName iin')
      .sort({ 'vaccinationHistory.nextDate': 1 });


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
    const stats = await HealthPassport.aggregate([
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

    const total = await HealthPassport.countDocuments();

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