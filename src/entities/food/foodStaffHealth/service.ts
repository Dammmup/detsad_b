import FoodStaffHealth from './model';
import { IFoodStaffHealth } from './model';
import User from '../../users/model'; // Using the user model

// Отложенное создание моделей
let FoodStaffHealthModel: any = null;
let UserModel: any = null;

const getFoodStaffHealthModel = () => {
  if (!FoodStaffHealthModel) {
    FoodStaffHealthModel = FoodStaffHealth();
  }
  return FoodStaffHealthModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User();
  }
  return UserModel;
};

export class FoodStaffHealthService {
  async getAll(filters: { staffId?: string, date?: string, doctorId?: string, status?: string, healthStatus?: string, vaccinationStatus?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.healthStatus) filter.healthStatus = filters.healthStatus;
    if (filters.vaccinationStatus) filter.vaccinationStatus = filters.vaccinationStatus;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const records = await getFoodStaffHealthModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getById(id: string) {
    const record = await getFoodStaffHealthModel().findById(id)
      .populate('staffId', 'fullName role')
      .populate('doctor', 'fullName role');
    
    if (!record) {
      throw new Error('Запись здоровья сотрудника не найдена');
    }
    
    return record;
  }

  async create(recordData: Partial<IFoodStaffHealth>, userId: string) {
    // Проверяем обязательные поля
    if (!recordData.staffId) {
      throw new Error('Не указан сотрудник');
    }
    if (!recordData.date) {
      throw new Error('Не указана дата');
    }
    if (!recordData.medicalCommissionDate) {
      throw new Error('Не указана дата медицинской комиссии');
    }
    if (!recordData.medicalCommissionNumber) {
      throw new Error('Не указан номер медицинской комиссии');
    }
    if (!recordData.medicalCommissionResult) {
      throw new Error('Не указан результат медицинской комиссии');
    }
    if (!recordData.sanitaryMinimumDate) {
      throw new Error('Не указана дата санминимума');
    }
    if (!recordData.sanitaryMinimumResult) {
      throw new Error('Не указан результат санминимума');
    }
    if (!recordData.vaccinationStatus) {
      throw new Error('Не указан статус вакцинации');
    }
    if (!recordData.healthStatus) {
      throw new Error('Не указано состояние здоровья');
    }
    if (!recordData.doctor) {
      throw new Error('Не указан врач');
    }
    
    // Проверяем существование сотрудника
    const staff = await getUserModel().findById(recordData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }
    
    // Проверяем существование врача
    const doctor = await getUserModel().findById(recordData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }
    
    const foodStaffHealthModel = getFoodStaffHealthModel();
    const record = new foodStaffHealthModel({
      ...recordData,
      doctor: userId // Врач - текущий пользователь
    });
    
    await record.save();
    
    const populatedRecord = await foodStaffHealthModel.findById(record._id)
      .populate('staffId', 'fullName role')
      .populate('doctor', 'fullName role');
    
    return populatedRecord;
  }

  async update(id: string, data: Partial<IFoodStaffHealth>) {
    const updatedRecord = await getFoodStaffHealthModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('doctor', 'fullName role');
    
    if (!updatedRecord) {
      throw new Error('Запись здоровья сотрудника не найдена');
    }
    
    return updatedRecord;
  }

  async delete(id: string) {
    const result = await getFoodStaffHealthModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись здоровья сотрудника не найдена');
    }
    
    return { message: 'Запись здоровья сотрудника успешно удалена' };
  }

  async getByStaffId(staffId: string, filters: { date?: string, doctorId?: string, status?: string, healthStatus?: string, vaccinationStatus?: string, startDate?: string, endDate?: string }) {
    const filter: any = { staffId };
    
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.healthStatus) filter.healthStatus = filters.healthStatus;
    if (filters.vaccinationStatus) filter.vaccinationStatus = filters.vaccinationStatus;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const records = await getFoodStaffHealthModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getByDoctorId(doctorId: string, filters: { staffId?: string, status?: string, healthStatus?: string, vaccinationStatus?: string, startDate?: string, endDate?: string }) {
    const filter: any = { doctor: doctorId };
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.status) filter.status = filters.status;
    if (filters.healthStatus) filter.healthStatus = filters.healthStatus;
    if (filters.vaccinationStatus) filter.vaccinationStatus = filters.vaccinationStatus;
    
    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const records = await getFoodStaffHealthModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getUpcomingMedicalCommissions(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const records = await getFoodStaffHealthModel().find({
      nextMedicalCommissionDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'completed' }
    })
    .populate('staffId', 'fullName role')
    .populate('doctor', 'fullName role')
    .sort({ nextMedicalCommissionDate: 1 });
    
    return records;
  }

  async getUpcomingSanitaryMinimums(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const records = await getFoodStaffHealthModel().find({
      nextSanitaryMinimumDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'completed' }
    })
    .populate('staffId', 'fullName role')
    .populate('doctor', 'fullName role')
    .sort({ nextSanitaryMinimumDate: 1 });
    
    return records;
  }

  async getUpcomingVaccinations(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const records = await getFoodStaffHealthModel().find({
      nextVaccinationDate: {
        $gte: today,
        $lte: futureDate
      },
      vaccinationStatus: { $ne: 'up_to_date' }
    })
    .populate('staffId', 'fullName role')
    .populate('doctor', 'fullName role')
    .sort({ nextVaccinationDate: 1 });
    
    return records;
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'reviewed') {
    const record = await getFoodStaffHealthModel().findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('doctor', 'fullName role');
    
    if (!record) {
      throw new Error('Запись здоровья сотрудника не найдена');
    }
    
    return record;
  }

  async addRecommendations(id: string, recommendations: string) {
    const record = await getFoodStaffHealthModel().findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('doctor', 'fullName role');
    
    if (!record) {
      throw new Error('Запись здоровья сотрудника не найдена');
    }
    
    return record;
  }

  async getStatistics() {
    const healthStats = await getFoodStaffHealthModel().aggregate([
      {
        $group: {
          _id: '$healthStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const vaccinationStats = await getFoodStaffHealthModel().aggregate([
      {
        $group: {
          _id: '$vaccinationStatus',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const statusStats = await getFoodStaffHealthModel().aggregate([
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
    
    const total = await getFoodStaffHealthModel().countDocuments();
    
    return {
      total,
      byHealthStatus: healthStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byVaccinationStatus: vaccinationStats.reduce((acc, stat) => {
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