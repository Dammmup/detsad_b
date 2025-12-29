import express from 'express';
import { HOLIDAYS_2025, HOLIDAYS_2026, WORKING_SATURDAYS_2025 } from '../utils/productionCalendar';

const router = express.Router();

router.get('/holidays', (req, res) => {
    res.json({
        holidays: { 2025: HOLIDAYS_2025, 2026: HOLIDAYS_2026 },
        workingSaturdays: { 2025: WORKING_SATURDAYS_2025 } // useful if we want to show working Saturdays differently
    });
});

export default router;
