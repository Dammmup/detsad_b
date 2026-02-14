import DishQualityAssessment, { IDishQualityAssessment } from './dishQualityModel';
import { MenuItemsService } from '../menuItems/service';
import DailyMenu from '../dailyMenu/model';
import WeeklyMenuTemplate, { WEEKDAYS } from '../weeklyMenuTemplate/model';
import Dish from '../dishes/model';


const getDishQualityModel = () => {
    return DishQualityAssessment;
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

    async deleteAll(filters: { date?: string, group?: string } = {}) {
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

        await getDishQualityModel().deleteMany(filter);
        return { message: 'Записи оценки блюд успешно удалены' };
    }

    async generateByMenu(date: string, group: string, userId: string) {
        console.log(`[OrganolepticJournal] Generating for date: ${date}, group: ${group}`);
        const dateObj = new Date(date);
        const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

        let dishNames: string[] = [];

        // 1. Try to find DailyMenu first
        const dailyMenu = await DailyMenu.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('meals.breakfast.dishes meals.lunch.dishes meals.snack.dishes meals.dinner.dishes');

        if (dailyMenu) {
            console.log(`[OrganolepticJournal] Found DailyMenu for ${date}`);
            const meals = [
                ...dailyMenu.meals.breakfast.dishes,
                ...dailyMenu.meals.lunch.dishes,
                ...dailyMenu.meals.snack.dishes,
                ...dailyMenu.meals.dinner.dishes
            ];
            dishNames = meals.map((d: any) => d.name).filter(Boolean);
            console.log(`[OrganolepticJournal] Dishes from DailyMenu: ${dishNames.length}`);
        }

        // 2. If no DailyMenu, try WeeklyMenuTemplate
        if (dishNames.length === 0) {
            const dayOfWeekIndex = (new Date(date).getDay() + 6) % 7; // 0 = Monday
            const weekday = WEEKDAYS[dayOfWeekIndex];
            console.log(`[OrganolepticJournal] Searching in WeeklyMenuTemplate for weekday: ${weekday}`);

            const activeTemplate = await WeeklyMenuTemplate.findOne({ isActive: true });
            if (activeTemplate) {
                console.log(`[OrganolepticJournal] Found active template: ${activeTemplate.name}`);
                const dayMeals = activeTemplate.days[weekday];
                const allDishIds = [
                    ...(dayMeals.breakfast || []),
                    ...(dayMeals.lunch || []),
                    ...(dayMeals.snack || []),
                    ...(dayMeals.dinner || [])
                ];

                console.log(`[OrganolepticJournal] Dish IDs found in template: ${allDishIds.length}`);

                if (allDishIds.length > 0) {
                    const dishes = await Dish.find({ _id: { $in: allDishIds } });
                    dishNames = dishes.map(d => d.name);
                    console.log(`[OrganolepticJournal] Dish names found: ${dishNames.length}`);
                }
            } else {
                console.log(`[OrganolepticJournal] No active template found`);
            }
        }

        // 3. Last fallback - MenuItems (original logic)
        if (dishNames.length === 0) {
            console.log(`[OrganolepticJournal] Fallback to MenuItems`);
            const dayOfWeek = (new Date(date).getDay() + 6) % 7;
            const dayOfMonth = new Date(date).getDate();
            const weekNumber = Math.min(4, Math.ceil(dayOfMonth / 7));

            const menuItems = await menuItemsService.getAll({
                dayOfWeek,
                weekNumber,
                isAvailable: true
            });

            dishNames = menuItems.map(m => m.name);
            console.log(`[OrganolepticJournal] Dishes from MenuItems: ${dishNames.length}`);
        }

        if (dishNames.length === 0) {
            console.log(`[OrganolepticJournal] No dishes found to generate`);
            return [];
        }

        // Create records
        const Model = getDishQualityModel();
        const records = [];
        const groups = group === 'all'
            ? ['Ясельная', 'Младшая', 'Средняя', 'Старшая', 'Подготовительная']
            : [group];

        console.log(`[OrganolepticJournal] Creating records for ${dishNames.length} dishes in ${groups.length} groups`);

        for (const name of dishNames) {
            for (const grp of groups) {
                // Check if already exists
                const existing = await Model.findOne({
                    date: { $gte: startOfDay, $lte: endOfDay },
                    dish: name,
                    group: grp
                });

                if (existing) {
                    console.log(`[OrganolepticJournal] Skipping existing record: ${name} (${grp})`);
                    continue;
                }

                const record = new Model({
                    date: startOfDay,
                    dish: name,
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

        console.log(`[OrganolepticJournal] Generated ${records.length} new records`);
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
