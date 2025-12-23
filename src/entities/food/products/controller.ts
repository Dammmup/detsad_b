import { Request, Response } from 'express';
import { productsService } from './service';

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { category, status, supplier, expiringInDays, lowStock } = req.query;

        const products = await productsService.getAll({
            category: category as string,
            status: status as string,
            supplier: supplier as string,
            expiringInDays: expiringInDays ? parseInt(expiringInDays as string) : undefined,
            lowStock: lowStock === 'true'
        });

        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Ошибка получения продуктов' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const product = await productsService.getById(req.params.id);
        res.json(product);
    } catch (err: any) {
        console.error('Error fetching product:', err);
        res.status(404).json({ error: err.message || 'Продукт не найден' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const product = await productsService.create(req.body);
        res.status(201).json(product);
    } catch (err: any) {
        console.error('Error creating product:', err);
        res.status(400).json({ error: err.message || 'Ошибка создания продукта' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const product = await productsService.update(req.params.id, req.body);
        res.json(product);
    } catch (err: any) {
        console.error('Error updating product:', err);
        res.status(404).json({ error: err.message || 'Ошибка обновления продукта' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const result = await productsService.delete(req.params.id);
        res.json(result);
    } catch (err: any) {
        console.error('Error deleting product:', err);
        res.status(404).json({ error: err.message || 'Ошибка удаления продукта' });
    }
};

export const getExpiringProducts = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const days = req.query.days ? parseInt(req.query.days as string) : 7;
        const products = await productsService.getExpiringProducts(days);
        res.json(products);
    } catch (err: any) {
        console.error('Error fetching expiring products:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения продуктов' });
    }
};

export const getExpiredProducts = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const products = await productsService.getExpiredProducts();
        res.json(products);
    } catch (err: any) {
        console.error('Error fetching expired products:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения продуктов' });
    }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const products = await productsService.getLowStockProducts();
        res.json(products);
    } catch (err: any) {
        console.error('Error fetching low stock products:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения продуктов' });
    }
};

export const getProductAlerts = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const alerts = await productsService.getAlerts();
        res.json(alerts);
    } catch (err: any) {
        console.error('Error fetching product alerts:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения предупреждений' });
    }
};

export const decreaseProductStock = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { quantity } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Количество должно быть положительным числом' });
        }

        const product = await productsService.decreaseStock(req.params.id, quantity);
        res.json(product);
    } catch (err: any) {
        console.error('Error decreasing stock:', err);
        res.status(400).json({ error: err.message || 'Ошибка уменьшения запаса' });
    }
};

export const increaseProductStock = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { quantity } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Количество должно быть положительным числом' });
        }

        const product = await productsService.increaseStock(req.params.id, quantity);
        res.json(product);
    } catch (err: any) {
        console.error('Error increasing stock:', err);
        res.status(400).json({ error: err.message || 'Ошибка увеличения запаса' });
    }
};

export const getProductCategories = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const categories = await productsService.getCategories();
        res.json(categories);
    } catch (err: any) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения категорий' });
    }
};

export const getProductSuppliers = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const suppliers = await productsService.getSuppliers();
        res.json(suppliers);
    } catch (err: any) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения поставщиков' });
    }
};
