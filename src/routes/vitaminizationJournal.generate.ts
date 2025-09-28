import { Router } from 'express';
import VitaminizationRecord from '../models/VitaminizationRecord';
import MenuItem from '../models/MenuItem';

// ...основные CRUD-роуты...

const router = Router();

// ...существующие CRUD...

// Генерация записей по меню из MenuItem
router.post('/generate-by-menu', async (req, res) => {
  try {
    const { date, group, meal, nurse } = req.body;
    // Получаем блюда из справочника (MenuItem)
    const menuQuery: any = { isActive: true };
    if (meal) menuQuery.meal = meal;
    if (group && group !== 'all') menuQuery.$or = [{ group }, { group: 'all' }];
    const menuItems = await MenuItem.find(menuQuery);
    if (!menuItems.length) return res.status(404).json({ error: 'Нет подходящих блюд в меню' });

    const records = menuItems.map(item => ({
      date: date || new Date(),
      group: group || item.group || 'Все',
      meal: item.meal,
      dish: item.name,
      dose: item.vitaminDose,
      portions: item.defaultPortion,
      nurse: nurse || '',
      status: 'Проведено',
      notes: item.notes || '',
    }));
    const created = await VitaminizationRecord.insertMany(records);
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка генерации по меню' });
  }
});

export default router;
