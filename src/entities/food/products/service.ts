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

    // Атомарное уменьшение запаса продукта (защита от race condition)
    async decreaseStock(id: string, quantity: number) {
        const product = await Product.findOneAndUpdate(
            { _id: id, stockQuantity: { $gte: quantity } },
            { $inc: { stockQuantity: -quantity } },
            { new: true }
        );

        if (!product) {
            const existing = await Product.findById(id);
            if (!existing) {
                throw new Error('Продукт не найден');
            }
            throw new Error(`Недостаточно продукта "${existing.name}" на складе`);
        }

        return product;
    }

    // Атомарное увеличение запаса продукта
    async increaseStock(id: string, quantity: number) {
        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { stockQuantity: quantity } },
            { new: true }
        );

        if (!product) {
            throw new Error('Продукт не найден');
        }

        return product;
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

    async findByNameOrCreate(productData: { name: string, unit: string, weight?: number, weightUnit?: string }): Promise<IProduct> {
        const nameRegex = new RegExp(`^${productData.name.trim()}$`, 'i');
        let product = await Product.findOne({
            name: nameRegex,
            weight: productData.weight,
            weightUnit: productData.weightUnit || 'г'
        });

        if (product) {
            return product;
        } else {
            const newProduct = new Product({
                name: productData.name.trim(),
                unit: productData.unit || 'г',
                weight: productData.weight,
                weightUnit: productData.weightUnit || 'г',
                category: 'Бакалея', // Default category
                price: 0,
                stockQuantity: 0,
                minStockLevel: 100, // Default min stock
                status: 'active'
            });
            await newProduct.save();
            return newProduct;
        }
    }
}

export const productsService = new ProductsService();
