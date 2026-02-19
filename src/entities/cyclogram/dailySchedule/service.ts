import DailySchedule from './model';
import { IDailySchedule, IScheduleBlock } from './model';

export class DailyScheduleService {
    async getAll(filters: { groupId?: string, date?: string, weekNumber?: number, isTemplate?: boolean }) {
        const filter: any = {};
        if (filters.groupId) filter.groupId = filters.groupId;
        if (filters.date) filter.date = new Date(filters.date);
        if (filters.weekNumber) filter.weekNumber = filters.weekNumber;
        if (filters.isTemplate !== undefined) filter.isTemplate = filters.isTemplate;

        return DailySchedule.find(filter)
            .populate('groupId', 'name')
            .populate('createdBy', 'fullName')
            .sort({ date: 1 });
    }

    async getById(id: string) {
        const schedule = await DailySchedule.findById(id)
            .populate('groupId', 'name')
            .populate('createdBy', 'fullName')
            .populate('blocks.templateId', 'name type');
        if (!schedule) throw new Error('Расписание не найдено');
        return schedule;
    }

    async getByGroupAndDate(groupId: string, date: string) {
        return DailySchedule.findOne({ groupId, date: new Date(date) })
            .populate('groupId', 'name')
            .populate('blocks.templateId', 'name type');
    }

    async getWeekSchedule(groupId: string, startDate: string) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 4); // Monday to Friday

        return DailySchedule.find({
            groupId,
            date: { $gte: start, $lte: end }
        })
            .populate('groupId', 'name')
            .sort({ date: 1 });
    }

    async create(data: Partial<IDailySchedule>, userId: string) {
        if (!data.groupId) throw new Error('Не указана группа');
        if (!data.date) throw new Error('Не указана дата');

        // определить день недели
        const date = new Date(data.date);
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[date.getDay()] as any;

        if (dayOfWeek === 'sunday' || dayOfWeek === 'saturday') {
            throw new Error('Расписание можно создавать только на рабочие дни');
        }

        const schedule = new DailySchedule({
            ...data,
            dayOfWeek,
            createdBy: userId
        });
        await schedule.save();

        return DailySchedule.findById(schedule._id)
            .populate('groupId', 'name')
            .populate('createdBy', 'fullName');
    }

    async update(id: string, data: Partial<IDailySchedule>) {
        const schedule = await DailySchedule.findByIdAndUpdate(id, data, { new: true })
            .populate('groupId', 'name')
            .populate('createdBy', 'fullName');
        if (!schedule) throw new Error('Расписание не найдено');
        return schedule;
    }

    async updateBlocks(id: string, blocks: IScheduleBlock[]) {
        const schedule = await DailySchedule.findByIdAndUpdate(
            id,
            { blocks },
            { new: true }
        ).populate('groupId', 'name');
        if (!schedule) throw new Error('Расписание не найдено');
        return schedule;
    }

    async delete(id: string) {
        const result = await DailySchedule.findByIdAndDelete(id);
        if (!result) throw new Error('Расписание не найдено');
        return { message: 'Расписание успешно удалено' };
    }

    async copyFromPreviousWeek(groupId: string, targetDate: string) {
        const target = new Date(targetDate);

        // Приводим targetDate к понедельнику
        const dayOfWeek = target.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        target.setDate(target.getDate() + diffToMonday);

        const source = new Date(target);
        source.setDate(source.getDate() - 7);

        const sourceDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const results = [];

        for (let i = 0; i < 5; i++) {
            const sourceDate = new Date(source);
            sourceDate.setDate(sourceDate.getDate() + i);

            const targetDateCopy = new Date(target);
            targetDateCopy.setDate(targetDateCopy.getDate() + i);

            // Проверяем, не существует ли уже расписание на целевую дату
            const existingTarget = await DailySchedule.findOne({ groupId, date: targetDateCopy });
            if (existingTarget) {
                continue; // Пропускаем, если расписание уже есть
            }

            const existingSource = await DailySchedule.findOne({ groupId, date: sourceDate });
            if (existingSource) {
                const newSchedule = new DailySchedule({
                    groupId,
                    date: targetDateCopy,
                    dayOfWeek: sourceDays[i],
                    blocks: existingSource.blocks,
                    createdBy: existingSource.createdBy
                });
                await newSchedule.save();
                results.push(newSchedule);
            }
        }

        return results;
    }

    async getTemplates() {
        return DailySchedule.find({ isTemplate: true }).sort({ templateName: 1 });
    }
}
