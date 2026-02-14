import Dish, { IDish } from './model';
import { productsService } from '../products/service';

export class DishesService {
    async getAll(filters: { category?: string; subcategory?: string; isActive?: boolean; createdBy?: string }): Promise<IDish[]> {
        const query: any = {};

        if (filters.category) query.category = filters.category;
        if (filters.subcategory) query.subcategory = filters.subcategory;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.createdBy) query.createdBy = filters.createdBy;

        return Dish.find(query)
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName')
            .sort({ name: 1 });
    }

    async getById(id: string) {
        const dish = await Dish.findById(id)
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName');

        if (!dish) {
            throw new Error('Блюдо не найдено');
        }
        return dish;
    }

    async create(data: Partial<IDish>) {
        if (!data.name) {
            throw new Error('Название блюда обязательно');
        }
        if (!data.category) {
            throw new Error('Категория обязательна');
        }
        if (!data.createdBy) {
            throw new Error('Создатель обязателен');
        }

        const dish = new Dish(data);
        await dish.save();

        return Dish.findById(dish._id)
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName');
    }

    async update(id: string, data: Partial<IDish>) {
        const dish = await Dish.findByIdAndUpdate(id, data, { new: true })
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName');

        if (!dish) {
            throw new Error('Блюдо не найдено');
        }
        return dish;
    }

    async delete(id: string) {
        const result = await Dish.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Блюдо не найдено');
        }
        return { message: 'Блюдо успешно удалено' };
    }

    async getByCategory(category: string) {
        return Dish.find({ category, isActive: true })
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .sort({ name: 1 });
    }

    async toggleActive(id: string) {
        const dish = await Dish.findById(id);
        if (!dish) {
            throw new Error('Блюдо не найдено');
        }

        dish.isActive = !dish.isActive;
        await dish.save();

        return Dish.findById(dish._id)
            .populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName');
    }

    // Рассчитать стоимость блюда по ингредиентам
    async calculateCost(id: string): Promise<number> {
        const dish = await Dish.findById(id)
            .populate('ingredients.productId', 'price unit');

        if (!dish) {
            throw new Error('Блюдо не найдено');
        }

        let totalCost = 0;
        for (const ingredient of dish.ingredients) {
            const product = ingredient.productId as any;
            if (product && product.price) {
                totalCost += product.price * ingredient.quantity;
            }
        }

        return totalCost;
    }

    // Проверить доступность ингредиентов для блюда
    async checkAvailability(id: string, servings: number = 1): Promise<{ available: boolean; missing: any[] }> {
        const dish = await Dish.findById(id)
            .populate('ingredients.productId', 'name unit stockQuantity');

        if (!dish) {
            throw new Error('Блюдо не найдено');
        }

        const missing: any[] = [];

        for (const ingredient of dish.ingredients) {
            const product = ingredient.productId as any;
            const requiredQuantity = ingredient.quantity * servings;

            if (!product || product.stockQuantity < requiredQuantity) {
                missing.push({
                    productId: product?._id,
                    productName: product?.name || 'Неизвестный продукт',
                    required: requiredQuantity,
                    available: product?.stockQuantity || 0,
                    unit: ingredient.unit
                });
            }
        }

        return {
            available: missing.length === 0,
            missing
        };
    }

    // Find dish by name (for duplicate checking)
    async findByName(name: string) {
        return Dish.findOne({
            name: { $regex: new RegExp(name, 'i') }
        }).populate('ingredients.productId', 'name unit price stockQuantity')
            .populate('createdBy', 'fullName');
    }
}

export const dishesService = new DishesService();

