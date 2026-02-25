import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Shift from '../entities/staffShifts/model';

export const checkAssistantChildrenAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (user.role === 'assistant') {
            const today = new Date();
            const options = { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
            const almatyDateStr = new Intl.DateTimeFormat('en-CA', options).format(today); // 'YYYY-MM-DD'

            const surrogateShift = await Shift.findOne({
                [`shifts.${almatyDateStr}.alternativeStaffId`]: new mongoose.Types.ObjectId(user.id)
            });

            if (!surrogateShift) {
                return res.status(403).json({ error: 'Доступ запрещен. Вы не назначены заменяющим сотрудником на сегодня.' });
            }
        }

        next();
    } catch (error) {
        console.error('Error in checkAssistantChildrenAccess middleware:', error);
        res.status(500).json({ error: 'Internal server error while checking access' });
    }
};
