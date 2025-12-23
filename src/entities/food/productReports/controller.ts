import { Request, Response, NextFunction } from 'express';
import { productReportsService } from './service';

export class ProductReportsController {
    async getConsumptionReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'startDate и endDate обязательны' });
            }

            const report = await productReportsService.getConsumptionReport(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.json(report);
        } catch (error) {
            next(error);
        }
    }

    async getDailyConsumption(req: Request, res: Response, next: NextFunction) {
        try {
            const { date } = req.params;

            if (!date) {
                return res.status(400).json({ message: 'Дата обязательна' });
            }

            const consumption = await productReportsService.getDailyConsumption(new Date(date));
            res.json(consumption);
        } catch (error) {
            next(error);
        }
    }

    async getProductStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'startDate и endDate обязательны' });
            }

            const stats = await productReportsService.getProductStats(
                productId,
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getSummaryReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'startDate и endDate обязательны' });
            }

            const summary = await productReportsService.getSummaryReport(
                new Date(startDate as string),
                new Date(endDate as string)
            );
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
}

export const productReportsController = new ProductReportsController();
