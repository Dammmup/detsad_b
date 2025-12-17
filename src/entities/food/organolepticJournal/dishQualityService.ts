import createDishQualityAssessmentModel, { IDishQualityAssessment } from './dishQualityModel';
import { MenuItemsService } from '../menuItems/service';

let DishQualityModel: any = null;

const getDishQualityModel = () => {
    if (!DishQualityModel) {
        DishQualityModel = createDishQualityAssessmentModel();
    }
    return DishQualityModel;
};

const menuItemsService = new MenuItemsService();

export class DishQualityService {
    async getAll(filters: { date?: string, group?: string }) {
        const filter: any = {};

        if (filters.date) {
            const dateStart = new Date(filters.date);
            dateStart.setHours(0, 0, 0, 0);
            const dateEnd = new Date(filters.date);
            dateEnd.setHours(23, 59, 59, 999);
            filter.date = { $gte: dateStart, $lte: dateEnd };
        }

        if (filters.group && filters.group !== 'all') {
            filter.group = filters.group;
        }

        const records = await getDishQualityModel().find(filter)
            .populate('inspector', 'fullName role')
            .sort({ createdAt: -1 });

        return records;
    }

    async getById(id: string) {
        const record = await getDishQualityModel().findById(id)
            .populate('inspector', 'fullName role');

        if (!record) {
            throw new Error('Запись оценки блюда не найдена');
        }

        return record;
    }

    async create(data: Partial<IDishQualityAssessment>, userId: string) {
        if (!data.dish) {
            throw new Error('Не указано название блюда');
        }
        if (!data.date) {
            throw new Error('Не указана дата');
        }
        if (!data.group) {
            throw new Error('Не указана группа');
        }

        const Model = getDishQualityModel();
        const record = new Model({
            ...data,
            inspector: userId
        });

        await record.save();

        const populatedRecord = await Model.findById(record._id)
            .populate('inspector', 'fullName role');

        return populatedRecord;
    }

    async update(id: string, data: Partial<IDishQualityAssessment>) {
        const updatedRecord = await getDishQualityModel().findByIdAndUpdate(
            id,
            data,
            { new: true }
        ).populate('inspector', 'fullName role');

        if (!updatedRecord) {
            throw new Error('Запись оценки блюда не найдена');
        }

        return updatedRecord;
    }

    async delete(id: string) {
        const result = await getDishQualityModel().findByIdAndDelete(id);

        if (!result) {
            throw new Error('Запись оценки блюда не найдена');
        }

        return { message: 'Запись оценки блюда успешно удалена' };
    }

    async deleteAll() {
        await getDishQualityModel().deleteMany({});
        return { message: 'Все записи оценки блюд удалены' };
    }

    async generateByMenu(date: string, group: string, userId: string) {
        const dateObj = new Date(date);
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        // In the menu model, dayOfWeek is 0-6 where 0 = Monday
        let dayOfWeek = dateObj.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6; // Sunday becomes 6

        // Calculate week number (1-4)
        const dayOfMonth = dateObj.getDate();
        const weekNumber = Math.min(4, Math.ceil(dayOfMonth / 7));

        // Get menu items for this day and week
        const menuItems = await menuItemsService.getAll({
            dayOfWeek,
            weekNumber,
            isAvailable: true
        });

        if (menuItems.length === 0) {
            // If no menu items found for specific week, try without weekNumber filter
            const allDayItems = await menuItemsService.getAll({
                dayOfWeek,
                isAvailable: true
            });

            if (allDayItems.length === 0) {
                return [];
            }

            // Use these items instead
            const records = await this.createRecordsFromMenuItems(allDayItems, dateObj, group, userId);
            return records;
        }

        const records = await this.createRecordsFromMenuItems(menuItems, dateObj, group, userId);
        return records;
    }

    private async createRecordsFromMenuItems(menuItems: any[], date: Date, group: string, userId: string) {
        const Model = getDishQualityModel();
        const records = [];

        // If group is 'all', create records for all standard groups
        const groups = group === 'all'
            ? ['Ясельная', 'Младшая', 'Средняя', 'Старшая', 'Подготовительная']
            : [group];

        for (const menuItem of menuItems) {
            for (const grp of groups) {
                const record = new Model({
                    date,
                    dish: menuItem.name,
                    group: grp,
                    appearance: '',
                    taste: '',
                    smell: '',
                    decision: '',
                    inspector: userId
                });
                await record.save();

                const populatedRecord = await Model.findById(record._id)
                    .populate('inspector', 'fullName role');
                records.push(populatedRecord);
            }
        }

        return records;
    }
}
