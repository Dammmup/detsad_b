import WeeklyMenuTemplate, { IWeeklyMenuTemplate, WEEKDAYS, Weekday, IDayMeals } from './model';
import DailyMenu from '../dailyMenu/model';
import Dish from '../dishes/model';
import { productsService } from '../products/service';
import { sendTelegramNotificationToRoles } from '../../../utils/telegramNotifications';

export class WeeklyMenuTemplateService {
    async getAll(filters: { isActive?: boolean } = {}) {
        const query: any = {};
        if (filters.isActive !== undefined) query.isActive = filters.isActive;

        return WeeklyMenuTemplate.find(query)
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });
    }

    async getById(id: string) {
        const template = await WeeklyMenuTemplate.findById(id)
            .populate('createdBy', 'fullName');

        if (!template) {
            throw new Error('Шаблон меню не найден');
        }
        return template;
    }

    async getByIdWithDishes(id: string) {
        const template = await WeeklyMenuTemplate.findById(id)
            .populate('createdBy', 'fullName');

        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        // Популяция блюд для каждого дня
        const populatedTemplate = template.toObject();
        for (const day of WEEKDAYS) {
            for (const mealType of ['breakfast', 'lunch', 'snack', 'dinner'] as const) {
                const dishIds = populatedTemplate.days[day]?.[mealType] || [];
                if (dishIds.length > 0) {
                    const dishes = await Dish.find({ _id: { $in: dishIds } })
                        .select('name category ingredients')
                        .populate('ingredients.productId', 'name unit');
                    (populatedTemplate.days[day] as any)[mealType] = dishes;
                }
            }
        }

        return populatedTemplate;
    }

    async create(data: Partial<IWeeklyMenuTemplate>) {
        if (!data.name) {
            throw new Error('Название шаблона обязательно');
        }
        if (!data.createdBy) {
            throw new Error('Создатель обязателен');
        }

        // Инициализация пустых дней
        const emptyMeals: IDayMeals = { breakfast: [], lunch: [], snack: [], dinner: [] };
        const days: any = {};
        for (const day of WEEKDAYS) {
            days[day] = data.days?.[day] || { ...emptyMeals };
        }

        const template = new WeeklyMenuTemplate({
            ...data,
            days
        });

        await template.save();
        return this.getById(template._id.toString());
    }

    async update(id: string, data: Partial<IWeeklyMenuTemplate>) {
        const template = await WeeklyMenuTemplate.findByIdAndUpdate(id, data, { new: true })
            .populate('createdBy', 'fullName');

        if (!template) {
            throw new Error('Шаблон меню не найден');
        }
        return template;
    }

    async delete(id: string) {
        const result = await WeeklyMenuTemplate.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Шаблон меню не найден');
        }
        return { message: 'Шаблон меню успешно удален' };
    }

    // Добавить блюдо в день недели
    async addDishToDay(templateId: string, day: Weekday, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', dishId: string) {
        const template = await WeeklyMenuTemplate.findById(templateId);
        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        const dish = await Dish.findById(dishId);
        if (!dish) {
            throw new Error('Блюдо не найдено');
        }

        const updatePath = `days.${day}.${mealType}`;
        await WeeklyMenuTemplate.findByIdAndUpdate(templateId, {
            $addToSet: { [updatePath]: dishId }
        });

        return this.getById(templateId);
    }

    // Удалить блюдо из дня недели
    async removeDishFromDay(templateId: string, day: Weekday, mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', dishId: string) {
        const template = await WeeklyMenuTemplate.findById(templateId);
        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        const updatePath = `days.${day}.${mealType}`;
        await WeeklyMenuTemplate.findByIdAndUpdate(templateId, {
            $pull: { [updatePath]: dishId }
        });

        return this.getById(templateId);
    }

    // Применить шаблон к неделе (создание DailyMenu на 7 дней)
    async applyToWeek(templateId: string, startDate: Date, childCount: number, userId: string) {
        const template = await this.getByIdWithDishes(templateId);
        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        const createdMenus: any[] = [];
        const shortages: any[] = [];
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            const dayIndex = date.getDay();
            // Преобразуем воскресенье (0) в конец массива
            const weekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const weekday = WEEKDAYS[weekdayIndex];
            const dayMeals = template.days[weekday];

            // Проверяем существует ли меню на эту дату
            const existingMenu = await DailyMenu.findOne({
                date: { $gte: new Date(date.setHours(0, 0, 0, 0)), $lte: new Date(date.setHours(23, 59, 59, 999)) }
            });

            if (existingMenu) {
                continue; // Пропускаем если меню уже есть
            }

            // Рассчитываем требуемые продукты для этого дня
            const dayShortages = await this.calculateDayShortages(dayMeals as any, childCount);
            shortages.push(...dayShortages);

            // Создаём дневное меню
            const dailyMenu = new DailyMenu({
                date,
                totalChildCount: childCount,
                meals: {
                    breakfast: { dishes: dayMeals?.breakfast?.map((d: any) => d._id) || [], childCount: 0 },
                    lunch: { dishes: dayMeals?.lunch?.map((d: any) => d._id) || [], childCount: 0 },
                    snack: { dishes: dayMeals?.snack?.map((d: any) => d._id) || [], childCount: 0 },
                    dinner: { dishes: dayMeals?.dinner?.map((d: any) => d._id) || [], childCount: 0 }
                },
                createdBy: userId
            });

            await dailyMenu.save();
            createdMenus.push(dailyMenu);
        }

        // Уникальные нехватки продуктов
        const uniqueShortages = this.aggregateShortages(shortages);

        // Отправка уведомления в Telegram если есть нехватки
        if (uniqueShortages.length > 0) {
            await this.sendShortageNotification(uniqueShortages, startDate, 7);
        }

        return {
            createdMenus,
            shortages: uniqueShortages,
            message: `Создано ${createdMenus.length} меню на неделю`
        };
    }

    // Применить шаблон к месяцу (циклом на каждую неделю)
    async applyToMonth(templateId: string, startDate: Date, childCount: number, userId: string) {
        const template = await this.getByIdWithDishes(templateId);
        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        const createdMenus: any[] = [];
        const shortages: any[] = [];
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        // Получаем количество дней в месяце
        const year = start.getFullYear();
        const month = start.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = start.getDate();
        const remainingDays = daysInMonth - startDay + 1;

        for (let i = 0; i < remainingDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            const dayIndex = date.getDay();
            const weekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const weekday = WEEKDAYS[weekdayIndex];
            const dayMeals = template.days[weekday];

            // Проверяем существует ли меню на эту дату
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existingMenu = await DailyMenu.findOne({
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            if (existingMenu) {
                continue;
            }

            // Рассчитываем нехватки
            const dayShortages = await this.calculateDayShortages(dayMeals as any, childCount);
            shortages.push(...dayShortages);

            // Создаём меню
            const dailyMenu = new DailyMenu({
                date,
                totalChildCount: childCount,
                meals: {
                    breakfast: { dishes: dayMeals?.breakfast?.map((d: any) => d._id) || [], childCount: 0 },
                    lunch: { dishes: dayMeals?.lunch?.map((d: any) => d._id) || [], childCount: 0 },
                    snack: { dishes: dayMeals?.snack?.map((d: any) => d._id) || [], childCount: 0 },
                    dinner: { dishes: dayMeals?.dinner?.map((d: any) => d._id) || [], childCount: 0 }
                },
                createdBy: userId
            });

            await dailyMenu.save();
            createdMenus.push(dailyMenu);
        }

        const uniqueShortages = this.aggregateShortages(shortages);

        if (uniqueShortages.length > 0) {
            await this.sendShortageNotification(uniqueShortages, startDate, remainingDays);
        }

        return {
            createdMenus,
            shortages: uniqueShortages,
            message: `Создано ${createdMenus.length} меню на месяц`
        };
    }

    // Рассчитать нехватку продуктов для одного дня
    private async calculateDayShortages(dayMeals: IDayMeals, childCount: number) {
        const shortages: any[] = [];
        const requiredProducts: Map<string, { name: string; required: number; unit: string }> = new Map();

        // Собираем все ингредиенты из всех приёмов пищи
        for (const mealType of ['breakfast', 'lunch', 'snack', 'dinner'] as const) {
            const dishes = (dayMeals as any)?.[mealType] || [];
            for (const dish of dishes) {
                if (!dish.ingredients) continue;
                for (const ingredient of dish.ingredients) {
                    const productId = ingredient.productId?._id?.toString() || ingredient.productId?.toString();
                    if (!productId) continue;

                    const requiredQty = ingredient.quantity * childCount;
                    const existing = requiredProducts.get(productId);
                    if (existing) {
                        existing.required += requiredQty;
                    } else {
                        requiredProducts.set(productId, {
                            name: ingredient.productId?.name || 'Неизвестный продукт',
                            required: requiredQty,
                            unit: ingredient.unit
                        });
                    }
                }
            }
        }

        // Проверяем наличие
        for (const [productId, data] of requiredProducts) {
            try {
                const product = await productsService.getById(productId);
                if (product.stockQuantity < data.required) {
                    shortages.push({
                        productId,
                        productName: data.name,
                        required: data.required,
                        available: product.stockQuantity,
                        shortage: data.required - product.stockQuantity,
                        unit: data.unit
                    });
                }
            } catch (e) {
                // Продукт не найден
            }
        }

        return shortages;
    }

    // Агрегация нехваток (суммирование по продуктам)
    private aggregateShortages(shortages: any[]) {
        const aggregated: Map<string, any> = new Map();

        for (const s of shortages) {
            const existing = aggregated.get(s.productId);
            if (existing) {
                existing.required += s.required;
                existing.shortage += s.shortage;
            } else {
                aggregated.set(s.productId, { ...s });
            }
        }

        return Array.from(aggregated.values());
    }

    // Отправка уведомления в Telegram
    private async sendShortageNotification(shortages: any[], startDate: Date, days: number) {
        let message = `⚠️ *Нехватка продуктов*\n\n`;
        message += `📅 Период: ${startDate.toLocaleDateString('ru-RU')} (${days} дней)\n\n`;
        message += `🛒 *Необходимо закупить:*\n`;

        for (const s of shortages) {
            message += `• ${s.productName}: ${s.shortage.toFixed(2)} ${s.unit}\n`;
            message += `  (требуется: ${s.required.toFixed(2)}, в наличии: ${s.available.toFixed(2)})\n`;
        }

        await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    }

    // Расчёт требуемых продуктов для периода
    async calculateRequiredProducts(templateId: string, days: number, childCount: number) {
        const template = await this.getByIdWithDishes(templateId);
        if (!template) {
            throw new Error('Шаблон меню не найден');
        }

        const requiredProducts: Map<string, { name: string; required: number; available: number; unit: string }> = new Map();

        for (let i = 0; i < days; i++) {
            const weekdayIndex = i % 7;
            const weekday = WEEKDAYS[weekdayIndex];
            const dayMeals = template.days[weekday];

            for (const mealType of ['breakfast', 'lunch', 'snack', 'dinner'] as const) {
                const dishes = (dayMeals as any)?.[mealType] || [];
                for (const dish of dishes) {
                    if (!dish.ingredients) continue;
                    for (const ingredient of dish.ingredients) {
                        const productId = ingredient.productId?._id?.toString() || ingredient.productId?.toString();
                        if (!productId) continue;

                        const requiredQty = ingredient.quantity * childCount;
                        const existing = requiredProducts.get(productId);
                        if (existing) {
                            existing.required += requiredQty;
                        } else {
                            let available = 0;
                            try {
                                const product = await productsService.getById(productId);
                                available = product.stockQuantity;
                            } catch (e) { }

                            requiredProducts.set(productId, {
                                name: ingredient.productId?.name || 'Неизвестный продукт',
                                required: requiredQty,
                                available,
                                unit: ingredient.unit
                            });
                        }
                    }
                }
            }
        }

        const result = Array.from(requiredProducts.entries()).map(([productId, data]) => ({
            productId,
            ...data,
            shortage: Math.max(0, data.required - data.available),
            sufficient: data.available >= data.required
        }));

        return result.sort((a, b) => b.shortage - a.shortage);
    }
}

export const weeklyMenuTemplateService = new WeeklyMenuTemplateService();
