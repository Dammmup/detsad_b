import ProductPurchase, { IProductPurchase } from './model';
import { productsService } from '../products/service';
import Product from '../products/model';

export class ProductPurchaseService {
    async getAll(filters: {
        productId?: string;
        startDate?: Date;
        endDate?: Date;
        supplier?: string;
    } = {}) {
        const query: any = {};

        if (filters.productId) query.productId = filters.productId;
        if (filters.supplier) query.supplier = filters.supplier;

        if (filters.startDate || filters.endDate) {
            query.purchaseDate = {};
            if (filters.startDate) query.purchaseDate.$gte = filters.startDate;
            if (filters.endDate) query.purchaseDate.$lte = filters.endDate;
        }

        return ProductPurchase.find(query)
            .populate('productId', 'name category unit')
            .populate('createdBy', 'fullName')
            .sort({ purchaseDate: -1 });
    }

    async getById(id: string) {
        const purchase = await ProductPurchase.findById(id)
            .populate('productId', 'name category unit')
            .populate('createdBy', 'fullName');

        if (!purchase) {
            throw new Error('Закупка не найдена');
        }
        return purchase;
    }

    async create(data: Partial<IProductPurchase>) {
        if (!data.productId) {
            throw new Error('Продукт обязателен');
        }
        if (!data.quantity || data.quantity <= 0) {
            throw new Error('Количество должно быть положительным');
        }
        if (!data.createdBy) {
            throw new Error('Создатель обязателен');
        }

        // Проверяем существование продукта
        const product = await Product.findById(data.productId);
        if (!product) {
            throw new Error('Продукт не найден');
        }

        // Устанавливаем значения по умолчанию из продукта
        const purchaseData = {
            ...data,
            unit: data.unit || product.unit,
            supplier: data.supplier || product.supplier,
            pricePerUnit: data.pricePerUnit ?? product.price,
            totalPrice: (data.quantity || 0) * (data.pricePerUnit ?? product.price),
            purchaseDate: data.purchaseDate || new Date()
        };

        const purchase = new ProductPurchase(purchaseData);
        await purchase.save();

        // Увеличиваем количество продукта на складе
        await productsService.increaseStock(data.productId.toString(), data.quantity);

        // Обновляем цену и срок годности продукта если указаны
        const productUpdate: any = {};
        if (data.pricePerUnit) productUpdate.price = data.pricePerUnit;
        if (data.expirationDate) productUpdate.expirationDate = data.expirationDate;
        if (data.supplier) productUpdate.supplier = data.supplier;

        if (Object.keys(productUpdate).length > 0) {
            await Product.findByIdAndUpdate(data.productId, productUpdate);
        }

        return this.getById(purchase._id.toString());
    }

    async delete(id: string) {
        const purchase = await ProductPurchase.findById(id);
        if (!purchase) {
            throw new Error('Закупка не найдена');
        }

        // Уменьшаем количество продукта (отмена закупки)
        try {
            await productsService.decreaseStock(purchase.productId.toString(), purchase.quantity);
        } catch (e) {
            // Если продуктов недостаточно - просто удаляем запись
        }

        await ProductPurchase.findByIdAndDelete(id);
        return { message: 'Закупка успешно удалена' };
    }

    // История закупок по продукту
    async getProductHistory(productId: string, limit: number = 10) {
        return ProductPurchase.find({ productId })
            .populate('createdBy', 'fullName')
            .sort({ purchaseDate: -1 })
            .limit(limit);
    }

    // Статистика закупок за период
    async getStats(startDate: Date, endDate: Date) {
        const purchases = await ProductPurchase.find({
            purchaseDate: { $gte: startDate, $lte: endDate }
        }).populate('productId', 'name category');

        const totalAmount = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
        const totalItems = purchases.length;

        // Группировка по категориям
        const byCategory: { [key: string]: number } = {};
        const byProduct: { [key: string]: { name: string; total: number; quantity: number } } = {};

        for (const p of purchases) {
            const product = p.productId as any;
            if (product) {
                const category = product.category || 'other';
                byCategory[category] = (byCategory[category] || 0) + p.totalPrice;

                const productId = product._id.toString();
                if (!byProduct[productId]) {
                    byProduct[productId] = { name: product.name, total: 0, quantity: 0 };
                }
                byProduct[productId].total += p.totalPrice;
                byProduct[productId].quantity += p.quantity;
            }
        }

        return {
            totalAmount,
            totalItems,
            byCategory,
            byProduct: Object.values(byProduct).sort((a, b) => b.total - a.total)
        };
    }

    // Получить поставщиков
    async getSuppliers() {
        return ProductPurchase.distinct('supplier');
    }
}

export const productPurchaseService = new ProductPurchaseService();
