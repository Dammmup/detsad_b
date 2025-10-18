import { Request, Response } from 'express';
import { RentService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const rentService = new RentService();

export const getAllRents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { tenantId, period, status } = req.query;
    
    const rents = await rentService.getAll({
      tenantId: tenantId as string,
      period: period as string,
      status: status as string
    });
    
    res.json(rents);
  } catch (err) {
    console.error('Error fetching rents:', err);
    res.status(50).json({ error: 'Ошибка получения аренды' });
  }
};

export const getRentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const rent = await rentService.getById(req.params.id);
    res.json(rent);
  } catch (err: any) {
    console.error('Error fetching rent:', err);
    res.status(404).json({ error: err.message || 'Аренда не найдена' });
  }
};

export const createRent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    const rent = await rentService.create(req.body);
    res.status(201).json(rent);
  } catch (err: any) {
    console.error('Error creating rent:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания аренды' });
  }
};

export const updateRent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    const rent = await rentService.update(req.params.id, req.body);
    res.json(rent);
  } catch (err: any) {
    console.error('Error updating rent:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления аренды' });
  }
};

export const deleteRent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    const result = await rentService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting rent:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления аренды' });
  }
};

export const markRentAsPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    const rent = await rentService.markAsPaid(req.params.id);
    res.json(rent);
  } catch (err: any) {
    console.error('Error marking rent as paid:', err);
    res.status(404).json({ error: err.message || 'Ошибка отметки аренды как оплаченной' });
  }
};

export const generateRentSheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }
    
    const { period, tenantIds } = req.body;
    
    if (!period) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM (например, 2025-01)' });
    }
    
    // Проверяем формат периода
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)' });
    }
    
    // Импортируем модель пользователей для получения арендаторов
    const User = (await import('../users/model')).default;
    
    // Получаем пользователей, для которых нужно сгенерировать арендные листы
    let tenants;
    if (tenantIds && Array.isArray(tenantIds) && tenantIds.length > 0) {
      // Если передан список ID арендаторов, генерируем только для них
      tenants = await User.find({
        _id: { $in: tenantIds },
        role: { $ne: 'admin' } // Убедимся, что это не администраторы
      });
    } else {
      // В противном случае, генерируем для всех пользователей (кроме администраторов)
      tenants = await User.find({ role: { $ne: 'admin' } });
    }
    
    // Генерируем арендные листы для каждого арендатора
    for (const tenant of tenants) {
      // Вычисляем арендные данные
      // В реальной системе здесь будет более сложная логика расчета аренды
      // Временно используем фиксированное значение аренды или данные из профиля пользователя
      
      // Итоговая сумма (нам должны заплатить)
      const total = 0;
      
      // Создаем или обновляем запись аренды
      await rentService.createOrUpdateForTenant((tenant as any)._id.toString(), period, {
        amount: 0,
        total: total,
        status: 'active'
      });
    }
    
    res.status(200).json({ message: `Арендные листы успешно сгенерированы для периода: ${period}`, count: tenants.length });
  } catch (err: any) {
    console.error('Error generating rent sheets:', err);
    res.status(500).json({ error: err.message || 'Ошибка генерации арендных листов' });
  }
};