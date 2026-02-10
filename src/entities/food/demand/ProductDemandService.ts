import { dailyMenuService } from '../dailyMenu/service';
import { productsService } from '../products/service';
import { IProduct } from '../products/model';
import moment from 'moment';

export class ProductDemandService {
    /**
     * Анализирует потребность в продуктах на основе меню и текущих запасов.
     * Возвращает список продуктов, по которым есть предупреждения (низкий запас, истекает срок годности).
     * @param date Дата, для которой анализируется потребность.
     * @param defaultChildCount Количество детей, для которых рассчитывается меню, если не указано в меню.
     */
    async getProductWarnings(date: Date, defaultChildCount: number = 20) {
        const warnings: string[] = [];
        const criticalStockThreshold = 10; // Порог критического запаса в % от minStockLevel (не используется, но оставлен для контекста)
        const expiryWarningDays = 7; // Количество дней до истечения срока годности для предупреждения

        // 1. Получаем меню на указанную дату
        const dailyConsumption = await dailyMenuService.calculateDailyProductConsumption(date, defaultChildCount);

        // 2. Получаем все продукты
        const allProducts = await productsService.getAll();

        // Создаем карту продуктов для быстрого доступа
        const productMap = new Map<string, IProduct>();
        allProducts.forEach(p => productMap.set(p._id.toString(), p));

        // 3. Анализ на основе потребления по меню
        for (const item of dailyConsumption.products) {
            const product = productMap.get(item.productId);

            if (!product) {
                warnings.push(`Предупреждение: Продукт "${item.productName}" из меню не найден в базе данных.`);
                continue;
            }

            // Проверка на низкий запас относительно потребления
            // Если требуется больше, чем есть на складе
            if (product.stockQuantity < item.quantity) {
                warnings.push(`Низкий запас: Продукта "${product.name}" требуется ${item.quantity}${product.unit} на ${date.toLocaleDateString()}, но в наличии только ${product.stockQuantity}${product.unit}.`);
            } else if (product.minStockLevel && product.stockQuantity - item.quantity < product.minStockLevel) {
                 // Если после списания количество становится ниже минимального порога minStockLevel
                warnings.push(`Внимание: Запас "${product.name}" после списания на ${date.toLocaleDateString()} будет ниже минимального уровня (${product.minStockLevel}${product.unit}). Текущий запас: ${product.stockQuantity}${product.unit}.`);
            }
        }

        // 4. Анализ срока годности для всех продуктов
        for (const product of allProducts) {
            if (product.expirationDate) {
                const expiryMoment = moment(product.expirationDate);
                const daysUntilExpiry = expiryMoment.diff(moment(), 'days');

                if (daysUntilExpiry <= expiryWarningDays && daysUntilExpiry >= 0) {
                    warnings.push(`Срок годности истекает: Продукт "${product.name}" истекает через ${daysUntilExpiry} дней (${expiryMoment.format('DD.MM.YYYY')}).`);
                } else if (daysUntilExpiry < 0) {
                    warnings.push(`Просрочено: Продукт "${product.name}" просрочен ${Math.abs(daysUntilExpiry)} дней назад (${expiryMoment.format('DD.MM.YYYY')}).`);
                }
            }
        }
        
        return warnings;
    }
}

export const productDemandService = new ProductDemandService();
