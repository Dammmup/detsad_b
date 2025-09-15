import express from 'express';
import StaffTimeTracking from '../models/StaffTimeTracking';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// POST /api/staff-time-tracking — создать/отметить время
router.post('/', async (req, res) => {
  try {
    // Геофенсинг: сравнить координаты с эталонной точкой учреждения и радиусом
    const { location } = req.body;
    // Эталонная точка (можно вынести в настройки)
    const refLat = 43.222;
    const refLon = 76.851;
    const lat = Number(location?.latitude);
    const lon = Number(location?.longitude);
    const radius = Number(location?.radius) || 100;
    // Haversine formula
    function isInsideRadius(lat1: number, lon1: number, lat2: number, lon2: number, radius: number) {
      const R = 6371000;
      const toRad = (d: number) => d * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c <= radius;
    }
    const inZone = isInsideRadius(refLat, refLon, lat, lon, radius);
    const record = new StaffTimeTracking({ ...req.body, inZone });
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка создания записи', error: e });
  }
});

// GET /api/staff-time-tracking — получить табель по сотруднику/периоду
router.get('/', authorizeRole(['admin', 'staff']), async (req, res) => {
  try {
    const { staffId, from, to } = req.query;
    const filter: any = {};
    if (staffId) filter.staffId = staffId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from as string);
      if (to) filter.date.$lte = new Date(to as string);
    }
    const records = await StaffTimeTracking.find(filter).sort({ date: 1 });
    res.json({ success: true, data: records });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка получения записей', error: e });
  }
});

// PUT /api/staff-time-tracking/:id — редактировать отметку
router.put('/:id', authorizeRole(['admin', 'staff']), async (req, res) => {
  try {
    const updated = await StaffTimeTracking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка обновления записи', error: e });
  }
});

// DELETE /api/staff-time-tracking/:id — удалить отметку
router.delete('/:id', authorizeRole(['admin', 'staff']), async (req, res) => {
  try {
    await StaffTimeTracking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка удаления записи', error: e });
  }
});

export default router;
