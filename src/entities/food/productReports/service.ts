import DailyMenu from '../dailyMenu/model';
import Product from '../products/model';
import { ProductPurchaseService } from '../productPurchase/service';

export interface ConsumptionReportItem {
    productId: string;
    productName: string;
    category: string;
    totalConsumed: number;
    unit: string;
    byMealType: {
        breakfast: number;
        lunch: number;
        snack: number;
        dinner: number;
    };
}

export interface DailyConsumptionItem {
    date: Date;
    totalConsumed: number;
    mealBreakdown: {
        breakfast: number;
        lunch: number;
        snack: number;
        dinner: number;
    };
}

export class ProductReportsService {
    // Отчёт по расходу продуктов за период
    async getConsumptionReport(startDate: Date, endDate: Date): Promise<ConsumptionReportItem[]> {
        const menus = await DailyMenu.find({
            date: { $gte: startDate, $lte: endDate }
        });

        const consumption: Map<string, ConsumptionReportItem> = new Map();

        for (const menu of menus) {
            for (const log of menu.consumptionLogs) {
                const existing = consumption.get(log.productId.toString());
                if (existing) {
                    existing.totalConsumed += log.quantity;
                    existing.byMealType[log.mealType] += log.quantity;
                } else {
                    // Получаем информацию о продукте
                    let category = 'other';
                    try {
                        const product = await Product.findById(log.productId);
                        if (product) category = product.category;
                    } catch (e) { }

                    consumption.set(log.productId.toString(), {
                        productId: log.productId.toString(),
                        productName: log.productName,
                        category,
                        totalConsumed: log.quantity,
                        unit: log.unit,
                        byMealType: {
                            breakfast: log.mealType === 'breakfast' ? log.quantity : 0,
                            lunch: log.mealType === 'lunch' ? log.quantity : 0,
                            snack: log.mealType === 'snack' ? log.quantity : 0,
                            dinner: log.mealType === 'dinner' ? log.quantity : 0
                        }
                    });
                }
            }
        }

        return Array.from(consumption.values()).sort((a, b) => b.totalConsumed - a.totalConsumed);
    }

    // Расход за конкретный день
    async getDailyConsumption(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const menu = await DailyMenu.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!menu) {
            return { products: [], totalChildCount: 0 };
        }

        const products: Map<string, any> = new Map();

        for (const log of menu.consumptionLogs) {
            const existing = products.get(log.productId.toString());
            if (existing) {
                existing.quantity += log.quantity;
            } else {
                products.set(log.productId.toString(), {
                    productId: log.productId.toString(),
                    productName: log.productName,
                    quantity: log.quantity,
                    unit: log.unit,
                    mealType: log.mealType
                });
            }
        }

        return {
            date: menu.date,
            totalChildCount: menu.totalChildCount,
            products: Array.from(products.values()),
            meals: {
                breakfast: { served: !!menu.meals.breakfast?.servedAt, childCount: menu.meals.breakfast?.childCount || 0 },
                lunch: { served: !!menu.meals.lunch?.servedAt, childCount: menu.meals.lunch?.childCount || 0 },
                snack: { served: !!menu.meals.snack?.servedAt, childCount: menu.meals.snack?.childCount || 0 },
                dinner: { served: !!menu.meals.dinner?.servedAt, childCount: menu.meals.dinner?.childCount || 0 }
            }
        };
    }

    // Статистика по конкретному продукту
    async getProductStats(productId: string, startDate: Date, endDate: Date) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Продукт не найден');
        }

        // Расход
        const menus = await DailyMenu.find({
            date: { $gte: startDate, $lte: endDate },
            'consumptionLogs.productId': productId
        });

        let totalConsumed = 0;
        const dailyConsumption: { date: Date; quantity: number }[] = [];
        const byMealType = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };

        for (const menu of menus) {
            let dayTotal = 0;
            for (const log of menu.consumptionLogs) {
                if (log.productId.toString() === productId) {
                    totalConsumed += log.quantity;
                    dayTotal += log.quantity;
                    byMealType[log.mealType] += log.quantity;
                }
            }
            if (dayTotal > 0) {
                dailyConsumption.push({ date: menu.date, quantity: dayTotal });
            }
        }

        // Закупки за период
        const purchaseService = new ProductPurchaseService();
        const purchases = await purchaseService.getAll({ productId, startDate, endDate });
        const totalPurchased = purchases.reduce((sum: number, p: any) => sum + p.quantity, 0);

        return {
            product: {
                id: product._id,
                name: product.name,
                category: product.category,
                unit: product.unit,
                currentStock: product.stockQuantity,
                minStockLevel: product.minStockLevel,
                expirationDate: product.expirationDate
            },
            period: { startDate, endDate },
            consumption: {
                total: totalConsumed,
                byMealType,
                daily: dailyConsumption.sort((a, b) => a.date.getTime() - b.date.getTime())
            },
            purchases: {
                total: totalPurchased,
                count: purchases.length
            },
            averageDailyConsumption: dailyConsumption.length > 0
                ? totalConsumed / dailyConsumption.length
                : 0
        };
    }

    // Сводный отчёт (дашборд)
    async getSummaryReport(startDate: Date, endDate: Date) {
        const consumption = await this.getConsumptionReport(startDate, endDate);

        // Текущее состояние склада
        const products = await Product.find({ status: 'active' });

        const lowStock = products.filter(p => p.stockQuantity <= p.minStockLevel);
        const expiringSoon = products.filter(p => {
            if (!p.expirationDate) return false;
            const daysUntil = Math.ceil((p.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7 && daysUntil > 0;
        });
        const expired = products.filter(p => p.expirationDate && p.expirationDate < new Date());

        // Группировка расхода по категориям
        const consumptionByCategory: { [key: string]: number } = {};
        for (const item of consumption) {
            consumptionByCategory[item.category] = (consumptionByCategory[item.category] || 0) + item.totalConsumed;
        }

        // Топ-10 расходуемых продуктов
        const topConsumed = consumption.slice(0, 10);

        return {
            period: { startDate, endDate },
            stockStatus: {
                totalProducts: products.length,
                lowStock: lowStock.length,
                expiringSoon: expiringSoon.length,
                expired: expired.length
            },
            consumption: {
                totalProducts: consumption.length,
                byCategory: consumptionByCategory,
                topConsumed
            },
            alerts: {
                lowStockProducts: lowStock.map(p => ({ id: p._id, name: p.name, stock: p.stockQuantity, min: p.minStockLevel })),
                expiringProducts: expiringSoon.map(p => ({ id: p._id, name: p.name, expirationDate: p.expirationDate })),
                expiredProducts: expired.map(p => ({ id: p._id, name: p.name, expirationDate: p.expirationDate }))
            }
        };
    }
    // Данные для ведомости контроля норм (расход + дето-дни)
    async getNormsData(startDate: Date, endDate: Date) {
        const menus = await DailyMenu.find({
            date: { $gte: startDate, $lte: endDate }
        });

        let totalChildDays = 0;
        const consumption: Map<string, { productId: string, productName: string, totalConsumed: number, unit: string }> = new Map();

        for (const menu of menus) {
            totalChildDays += menu.totalChildCount || 0;

            for (const log of menu.consumptionLogs) {
                const key = log.productId.toString();
                const existing = consumption.get(key);
                if (existing) {
                    existing.totalConsumed += log.quantity;
                } else {
                    consumption.set(key, {
                        productId: key,
                        productName: log.productName,
                        totalConsumed: log.quantity,
                        unit: log.unit
                    });
                }
            }
        }

        return {
            period: { startDate, endDate },
            totalChildDays,
            daysCount: menus.length,
            consumption: Array.from(consumption.values())
        };
    }
}

export const productReportsService = new ProductReportsService();
