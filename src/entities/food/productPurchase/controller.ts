import { Request, Response, NextFunction } from 'express';
import { productPurchaseService } from './service';

export class ProductPurchaseController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId, startDate, endDate, supplier } = req.query;
            const filters: any = {};

            if (productId) filters.productId = productId;
            if (supplier) filters.supplier = supplier;
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);

            const purchases = await productPurchaseService.getAll(filters);
            res.json(purchases);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const purchase = await productPurchaseService.getById(req.params.id);
            res.json(purchase);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const purchase = await productPurchaseService.create({
                ...req.body,
                createdBy: (req as any).user?.id
            });
            res.status(201).json(purchase);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productPurchaseService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getProductHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;
            const { limit } = req.query;

            const history = await productPurchaseService.getProductHistory(
                productId,
                parseInt(limit as string) || 10
            );
            res.json(history);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'startDate и endDate обязательны' });
            }

            const stats = await productPurchaseService.getStats(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getSuppliers(req: Request, res: Response, next: NextFunction) {
        try {
            const suppliers = await productPurchaseService.getSuppliers();
            res.json(suppliers);
        } catch (error) {
            next(error);
        }
    }
}

export const productPurchaseController = new ProductPurchaseController();
