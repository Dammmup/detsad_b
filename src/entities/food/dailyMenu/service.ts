import DailyMenu, { IDailyMenu, IMeal } from './model';
import Dish from '../dishes/model';
import { productsService } from '../products/service';

export class DailyMenuService {
    async getAll(filters: { startDate?: Date; endDate?: Date } = {}) {
        const query: any = {};

        if (filters.startDate || filters.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }

        return DailyMenu.find(query)
            .populate({
                path: 'meals.breakfast.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.lunch.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.dinner.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.snack.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate('createdBy', 'fullName')
            .sort({ date: -1 });
    }

    async getById(id: string) {
        const menu = await DailyMenu.findById(id)
            .populate({
                path: 'meals.breakfast.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.lunch.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.dinner.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.snack.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate('createdBy', 'fullName');

        if (!menu) {
            throw new Error('Меню не найдено');
        }
        return menu;
    }

    async getByDate(date: Date) {
        // Нормализуем дату к началу дня
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const menu = await DailyMenu.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate({
                path: 'meals.breakfast.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.lunch.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.dinner.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.snack.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate('createdBy', 'fullName');

        return menu;
    }

    async create(data: Partial<IDailyMenu>) {
        if (!data.date) {
            throw new Error('Дата обязательна');
        }
        if (!data.createdBy) {
            throw new Error('Создатель обязателен');
        }

        // Проверка на существование меню на эту дату
        const existingMenu = await this.getByDate(new Date(data.date));
        if (existingMenu) {
            throw new Error('Меню на эту дату уже существует');
        }

        const menu = new DailyMenu({
            ...data,
            meals: {
                breakfast: { dishes: [], childCount: 0 },
                lunch: { dishes: [], childCount: 0 },
                dinner: { dishes: [], childCount: 0 },
                snack: { dishes: [], childCount: 0 },
                ...data.meals
            }
        });

        await menu.save();
        return this.getById(menu._id.toString());
    }

    async update(id: string, data: Partial<IDailyMenu>) {
        const menu = await DailyMenu.findByIdAndUpdate(id, data, { new: true })
            .populate({
                path: 'meals.breakfast.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.lunch.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.dinner.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate({
                path: 'meals.snack.dishes',
                select: 'name category ingredients',
                populate: { path: 'ingredients.productId', select: 'name' }
            })
            .populate('createdBy', 'fullName');

        if (!menu) {
            throw new Error('Меню не найдено');
        }
        return menu;
    }

    async delete(id: string) {
        const result = await DailyMenu.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Меню не найдено');
        }
        return { message: 'Меню успешно удалено' };
    }

    // Подать приём пищи - списание продуктов
    async serveMeal(id: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', childCount: number) {
        const menu = await DailyMenu.findById(id)
            .populate({
                path: `meals.${mealType}.dishes`,
                populate: {
                    path: 'ingredients.productId',
                    select: 'name unit stockQuantity'
                }
            });

        if (!menu) {
            throw new Error('Меню не найдено');
        }

        const meal = menu.meals[mealType];
        if (!meal || !meal.dishes || meal.dishes.length === 0) {
            throw new Error(`Нет блюд для ${mealType}`);
        }

        if (meal.servedAt) {
            throw new Error(`${mealType} уже был подан в ${meal.servedAt.toLocaleTimeString()}`);
        }

        const consumptionLogs: any[] = [];
        const productUpdates: { productId: string; quantity: number }[] = [];

        // Собираем все ингредиенты из всех блюд
        for (const dish of meal.dishes as any[]) {
            if (!dish.ingredients) continue;

            for (const ingredient of dish.ingredients) {
                const product = ingredient.productId;
                if (!product) continue;

                const requiredQuantity = ingredient.quantity * childCount;

                // Проверяем достаточно ли продукта
                if (product.stockQuantity < requiredQuantity) {
                    throw new Error(`Недостаточно продукта "${product.name}". Требуется: ${requiredQuantity}, Доступно: ${product.stockQuantity}`);
                }

                productUpdates.push({
                    productId: product._id.toString(),
                    quantity: requiredQuantity
                });

                consumptionLogs.push({
                    mealType,
                    productId: product._id,
                    productName: product.name,
                    quantity: requiredQuantity,
                    unit: ingredient.unit,
                    consumedAt: new Date()
                });
            }
        }

        // Списываем продукты
        for (const update of productUpdates) {
            await productsService.decreaseStock(update.productId, update.quantity);
        }

        // Обновляем меню
        const updatePath = `meals.${mealType}`;
        await DailyMenu.findByIdAndUpdate(id, {
            $set: {
                [`${updatePath}.servedAt`]: new Date(),
                [`${updatePath}.childCount`]: childCount
            },
            $push: {
                consumptionLogs: { $each: consumptionLogs }
            }
        });

        return this.getById(id);
    }

    // Отменить подачу (вернуть продукты)
    async cancelMeal(id: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
        const menu = await DailyMenu.findById(id);

        if (!menu) {
            throw new Error('Меню не найдено');
        }

        const meal = menu.meals[mealType];
        if (!meal.servedAt) {
            throw new Error(`${mealType} еще не был подан`);
        }

        // Возвращаем продукты на склад
        const logsToRevert = menu.consumptionLogs.filter(log => log.mealType === mealType);
        for (const log of logsToRevert) {
            await productsService.increaseStock(log.productId.toString(), log.quantity);
        }

        // Обновляем меню
        const updatePath = `meals.${mealType}`;
        await DailyMenu.findByIdAndUpdate(id, {
            $set: {
                [`${updatePath}.servedAt`]: null,
                [`${updatePath}.childCount`]: 0
            },
            $pull: {
                consumptionLogs: { mealType }
            }
        });

        return this.getById(id);
    }

    // Получить меню на сегодня
    async getTodayMenu() {
        return this.getByDate(new Date());
    }

    // Добавить блюдо в приём пищи
    async addDishToMeal(id: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', dishId: string) {
        const menu = await DailyMenu.findById(id);
        if (!menu) {
            throw new Error('Меню не найдено');
        }

        const dish = await Dish.findById(dishId);
        if (!dish) {
            throw new Error('Блюдо не найдено');
        }

        const updatePath = `meals.${mealType}.dishes`;
        await DailyMenu.findByIdAndUpdate(id, {
            $addToSet: { [updatePath]: dishId }
        });

        return this.getById(id);
    }

    // Удалить блюдо из приёма пищи
    async removeDishFromMeal(id: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', dishId: string) {
        const menu = await DailyMenu.findById(id);
        if (!menu) {
            throw new Error('Меню не найдено');
        }

        const updatePath = `meals.${mealType}.dishes`;
        await DailyMenu.findByIdAndUpdate(id, {
            $pull: { [updatePath]: dishId }
        });

        return this.getById(id);
    }

    // Расчёт расхода продуктов на день
    async calculateDailyProductConsumption(date: Date, childCount: number) {
        const menu = await this.getByDate(date);

        if (!menu) {
            throw new Error('Меню на выбранную дату не найдено');
        }

        const productConsumption: {
            productId: string;
            productName: string;
            quantity: number;
            unit: string;
            mealTypes: string[];
        }[] = [];

        // Обработка всех приёмов пищи
        const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];

        for (const mealType of mealTypes) {
            const meal = menu.meals[mealType];

            if (!meal || !meal.dishes || meal.dishes.length === 0) {
                continue;
            }

            // Проходим по каждому блюду в приёме пищи
            for (const dishId of meal.dishes) {
                const dish = await Dish.findById(dishId).populate('ingredients.productId');

                if (!dish || !dish.ingredients) {
                    continue;
                }

                // Проходим по каждому ингредиенту блюда
                for (const ingredient of dish.ingredients) {
                    const product = ingredient.productId as any;

                    if (!product) {
                        continue;
                    }

                    const requiredQuantity = ingredient.quantity * childCount;

                    // Проверяем, есть ли уже такой продукт в списке
                    const existingProduct = productConsumption.find(p => p.productId === product._id.toString());

                    if (existingProduct) {
                        // Увеличиваем количество и добавляем тип приёма пищи
                        existingProduct.quantity += requiredQuantity;
                        if (!existingProduct.mealTypes.includes(mealType)) {
                            existingProduct.mealTypes.push(mealType);
                        }
                    } else {
                        // Добавляем новый продукт
                        productConsumption.push({
                            productId: product._id.toString(),
                            productName: product.name,
                            quantity: requiredQuantity,
                            unit: ingredient.unit,
                            mealTypes: [mealType]
                        });
                    }
                }
            }
        }

        return {
            date: menu.date,
            childCount,
            products: productConsumption
        };
    }
}

export const dailyMenuService = new DailyMenuService();
