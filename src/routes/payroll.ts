import express from 'express';
import Payroll from '../models/Payroll';

const router = express.Router();

// GET /api/payroll — список всех расчетных листов (с фильтрами)
router.get('/', async (req, res) => {
  try {
    const { staffId, month } = req.query;
    const filter: any = {};
    if (staffId) filter.staffId = staffId;
    if (month) filter.month = month;
    const data = await Payroll.find(filter).populate('staffId', 'fullName role email');
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Ошибка получения расчетных листов', error: e });
  }
});

// POST /api/payroll — создать расчетный лист
router.post('/', async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json({ success: true, data: payroll });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка создания расчетного листа', error: e });
  }
});

// PUT /api/payroll/:id — обновить расчетный лист
router.put('/:id', async (req, res) => {
  try {
    const updated = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка обновления расчетного листа', error: e });
  }
});

// DELETE /api/payroll/:id — удалить расчетный лист
router.delete('/:id', async (req, res) => {
  try {
    await Payroll.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка удаления расчетного листа', error: e });
  }
});

export default router;
