import RiskGroupChild from './model';
import { IRiskGroupChild } from './model';
import User from '../auth/model'; // Using the user model

export class RiskGroupChildrenService {
  async getAll(filters: { childId?: string, date?: string, doctorId?: string, status?: string, riskFactor?: string, startDate?: string, endDate?: string, nextAssessmentDate?: string }) {
    const filter: any = {};
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.riskFactor) filter.riskFactors = { $in: [filters.riskFactor] };
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAssessmentDate) {
      filter.nextAssessmentDate = new Date(filters.nextAssessmentDate);
    }
    
    const children = await RiskGroupChild.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return children;
  }

  async getById(id: string) {
    const child = await RiskGroupChild.findById(id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    if (!child) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }
    
    return child;
  }

  async create(childData: Partial<IRiskGroupChild>, userId: string) {
    // Проверяем обязательные поля
    if (!childData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!childData.date) {
      throw new Error('Не указана дата');
    }
    if (!childData.riskFactors || childData.riskFactors.length === 0) {
      throw new Error('Не указаны факторы риска');
    }
    if (!childData.assessment) {
      throw new Error('Не указана оценка');
    }
    if (!childData.doctor) {
      throw new Error('Не указан врач');
    }
    
    // Проверяем существование ребенка
    const child = await User.findById(childData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }
    
    // Проверяем существование врача
    const doctor = await User.findById(childData.doctor);
    if (!doctor) {
      throw new Error('Врач не найден');
    }
    
    const riskChild = new RiskGroupChild({
      ...childData,
      doctor: userId // Врач - текущий пользователь
    });
    
    await riskChild.save();
    
    const populatedChild = await RiskGroupChild.findById(riskChild._id)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role');
    
    return populatedChild;
  }

  async update(id: string, data: Partial<IRiskGroupChild>) {
    const updatedChild = await RiskGroupChild.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!updatedChild) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }
    
    return updatedChild;
  }

  async delete(id: string) {
    const result = await RiskGroupChild.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }
    
    return { message: 'Запись ребенка из группы риска успешно удалена' };
  }

  async getByChildId(childId: string, filters: { date?: string, doctorId?: string, status?: string, riskFactor?: string, startDate?: string, endDate?: string, nextAssessmentDate?: string }) {
    const filter: any = { childId };
    
    if (filters.doctorId) filter.doctor = filters.doctorId;
    if (filters.status) filter.status = filters.status;
    if (filters.riskFactor) filter.riskFactors = { $in: [filters.riskFactor] };
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAssessmentDate) {
      filter.nextAssessmentDate = new Date(filters.nextAssessmentDate);
    }
    
    const children = await RiskGroupChild.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return children;
  }

  async getByDoctorId(doctorId: string, filters: { childId?: string, status?: string, riskFactor?: string, startDate?: string, endDate?: string, nextAssessmentDate?: string }) {
    const filter: any = { doctor: doctorId };
    
    if (filters.childId) filter.childId = filters.childId;
    if (filters.status) filter.status = filters.status;
    if (filters.riskFactor) filter.riskFactors = { $in: [filters.riskFactor] };
    
    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.nextAssessmentDate) {
      filter.nextAssessmentDate = new Date(filters.nextAssessmentDate);
    }
    
    const children = await RiskGroupChild.find(filter)
      .populate('childId', 'fullName iin')
      .populate('doctor', 'fullName role')
      .sort({ date: -1 });
    
    return children;
  }

  async getUpcomingAssessments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const children = await RiskGroupChild.find({
      nextAssessmentDate: {
        $gte: today,
        $lte: futureDate
      }
    })
    .populate('childId', 'fullName iin')
    .populate('doctor', 'fullName role')
    .sort({ nextAssessmentDate: 1 });
    
    return children;
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'reviewed') {
    const child = await RiskGroupChild.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!child) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }
    
    return child;
  }

  async addRecommendations(id: string, recommendations: string) {
    const child = await RiskGroupChild.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('childId', 'fullName iin')
     .populate('doctor', 'fullName role');
    
    if (!child) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }
    
    return child;
  }

  async getStatistics() {
    const stats = await RiskGroupChild.aggregate([
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
    
    const riskFactorStats = await RiskGroupChild.aggregate([
      {
        $unwind: '$riskFactors'
      },
      {
        $group: {
          _id: '$riskFactors',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await RiskGroupChild.countDocuments();
    
    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byRiskFactor: riskFactorStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}