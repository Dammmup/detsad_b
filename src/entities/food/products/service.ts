import Product, { IProduct } from './model';

export class ProductsService {
    async getAll(filters: {
        category?: string;
        status?: string;
        supplier?: string;
        expiringInDays?: number;
        lowStock?: boolean;
    } = {}) {
        const query: any = {};

        if (filters.category) query.category = filters.category;
        if (filters.status) query.status = filters.status;
        if (filters.supplier) query.supplier = filters.supplier;

        // Фильтр для продуктов с истекающим сроком годности
        if (filters.expiringInDays) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + filters.expiringInDays);
            query.expirationDate = { $lte: futureDate, $gte: new Date() };
        }

        // Фильтр для продуктов с низким запасом
        if (filters.lowStock) {
            query.$expr = { $lte: ['$stockQuantity', '$minStockLevel'] };
        }

        return Product.find(query).sort({ name: 1 });
    }

    async getById(id: string) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Продукт не найден');
        }
        return product;
    }

    async create(data: Partial<IProduct>) {
        if (!data.name) {
            throw new Error('Название продукта обязательно');
        }
        const product = new Product(data);
        return product.save();
    }

    async update(id: string, data: Partial<IProduct>) {
        const product = await Product.findByIdAndUpdate(id, data, { new: true });
        if (!product) {
            throw new Error('Продукт не найден');
        }
        return product;
    }

    async delete(id: string) {
        const result = await Product.findByIdAndDelete(id);
        if (!result) {
            throw new Error('Продукт не найден');
        }
        return { message: 'Продукт успешно удален' };
    }

    // Продукты с истекающим сроком годности
    async getExpiringProducts(days: number = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return Product.find({
            expirationDate: { $lte: futureDate, $gte: new Date() },
            status: 'active'
        }).sort({ expirationDate: 1 });
    }

    // Продукты с истекшим сроком годности
    async getExpiredProducts() {
        return Product.find({
            expirationDate: { $lt: new Date() },
            status: 'active'
        }).sort({ expirationDate: 1 });
    }

    // Продукты с низким запасом
    async getLowStockProducts() {
        return Product.find({
            $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
            status: 'active'
        }).sort({ stockQuantity: 1 });
    }

    // Уменьшение запаса продукта
    async decreaseStock(id: string, quantity: number) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Продукт не найден');
        }

        if (product.stockQuantity < quantity) {
            throw new Error(`Недостаточно продукта "${product.name}" на складе`);
        }

        product.stockQuantity -= quantity;
        return product.save();
    }

    // Увеличение запаса продукта
    async increaseStock(id: string, quantity: number) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Продукт не найден');
        }

        product.stockQuantity += quantity;
        return product.save();
    }

    // Получить категории продуктов
    async getCategories() {
        return Product.distinct('category');
    }

    // Получить поставщиков
    async getSuppliers() {
        return Product.distinct('supplier');
    }

    // Получение предупреждений (истекающие сроки и низкий запас)
    async getAlerts() {
        const [expiring, expired, lowStock] = await Promise.all([
            this.getExpiringProducts(7),
            this.getExpiredProducts(),
            this.getLowStockProducts()
        ]);

        return {
            expiring,
            expired,
            lowStock,
            totalAlerts: expiring.length + expired.length + lowStock.length
        };
    }
}

export const productsService = new ProductsService();
