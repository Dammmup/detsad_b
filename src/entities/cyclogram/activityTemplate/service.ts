import ActivityTemplate from './model';
import { IActivityTemplate, ActivityType } from './model';

export class ActivityTemplateService {
    async getAll(filters: { type?: ActivityType, ageGroup?: string, isActive?: boolean }) {
        const filter: any = {};
        if (filters.type) filter.type = filters.type;
        if (filters.ageGroup) filter.ageGroups = { $in: [filters.ageGroup, 'все'] };
        if (filters.isActive !== undefined) filter.isActive = filters.isActive;

        return ActivityTemplate.find(filter).sort({ type: 1, order: 1, name: 1 });
    }

    async getById(id: string) {
        const template = await ActivityTemplate.findById(id);
        if (!template) throw new Error('Шаблон не найден');
        return template;
    }

    async getByType(type: ActivityType) {
        return ActivityTemplate.find({ type, isActive: true }).sort({ order: 1, name: 1 });
    }

    async create(data: Partial<IActivityTemplate>) {
        if (!data.name) throw new Error('Не указано название');
        if (!data.type) throw new Error('Не указан тип');
        if (!data.content) throw new Error('Не указано содержание');

        const template = new ActivityTemplate(data);
        await template.save();
        return template;
    }

    async update(id: string, data: Partial<IActivityTemplate>) {
        const template = await ActivityTemplate.findByIdAndUpdate(id, data, { new: true });
        if (!template) throw new Error('Шаблон не найден');
        return template;
    }

    async delete(id: string) {
        const result = await ActivityTemplate.findByIdAndDelete(id);
        if (!result) throw new Error('Шаблон не найден');
        return { message: 'Шаблон успешно удалён' };
    }

    async bulkCreate(templates: Partial<IActivityTemplate>[]) {
        return ActivityTemplate.insertMany(templates);
    }

    async getActivityTypes() {
        return [
            { value: 'reception', label: 'Прием детей' },
            { value: 'parents_work', label: 'Работа с родителями' },
            { value: 'independent_activity', label: 'Самостоятельная деятельность' },
            { value: 'morning_gymnastics', label: 'Утренняя гимнастика' },
            { value: 'breakfast', label: 'Завтрак' },
            { value: 'preparation_OD', label: 'Подготовка к ОД' },
            { value: 'OD', label: 'Организованная деятельность' },
            { value: 'second_breakfast', label: 'Второй завтрак' },
            { value: 'walk', label: 'Прогулка' },
            { value: 'return_from_walk', label: 'Возвращение с прогулки' },
            { value: 'lunch', label: 'Обед' },
            { value: 'day_sleep', label: 'Дневной сон' },
            { value: 'awakening', label: 'Пробуждение' },
            { value: 'snack', label: 'Полдник' },
            { value: 'evening_activity', label: 'Вечерняя деятельность' },
            { value: 'home_departure', label: 'Уход домой' },
            { value: 'other', label: 'Другое' }
        ];
    }
}
