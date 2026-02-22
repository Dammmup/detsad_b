import FoodStaffDailyLog, { IFoodStaffDailyLog } from './model';
import User from '../../users/model';

export class FoodStaffDailyLogService {
    async getAll(filters: { staffId?: string, startDate?: string, endDate?: string } = {}) {
        const query: any = {};

        if (filters.staffId) query.staffId = filters.staffId;
        if (filters.startDate || filters.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = new Date(filters.startDate);
            if (filters.endDate) query.date.$lte = new Date(filters.endDate);
        }

        return FoodStaffDailyLog.find(query)
            .populate('staffId', 'fullName role')
            .populate('doctor', 'fullName role')
            .sort({ date: -1 });
    }

    async create(data: Partial<IFoodStaffDailyLog>) {
        // Нормализуем дату (убираем время)
        if (data.date) {
            const d = new Date(data.date);
            d.setHours(0, 0, 0, 0);
            data.date = d;
        }

        const log = new FoodStaffDailyLog(data);
        return (await log.save()).populate(['staffId', 'doctor']);
    }

    async update(id: string, data: Partial<IFoodStaffDailyLog>) {
        const updated = await FoodStaffDailyLog.findByIdAndUpdate(id, data, { new: true })
            .populate('staffId', 'fullName role')
            .populate('doctor', 'fullName role');

        if (!updated) throw new Error('Запись не найдена');
        return updated;
    }

    async delete(id: string) {
        const result = await FoodStaffDailyLog.findByIdAndDelete(id);
        if (!result) throw new Error('Запись не найдена');
        return { success: true };
    }
}

export const foodStaffDailyLogService = new FoodStaffDailyLogService();
