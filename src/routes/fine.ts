import { Router, Request, Response, NextFunction } from 'express';
import Fine, { IFine } from '../models/Fine';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRole } from '../middlewares/authRole';

const router = Router();

// Add a new fine (Admin only)
router.post('/', [authenticate, authorizeRole(['admin'])], async (req: Request, res: Response) => {
  try {
    const { userId, amount, reason, type, notes } = req.body;
    
    const fine = new Fine({
      user: userId,
      amount,
      reason,
      type,
      notes,
      date: new Date()
    });

    await fine.save();
    
    res.status(201).json(fine);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ message: 'Ошибка при добавлении штрафа' });
  }
});

// Get all fines for a user (Admin can see all, users can see their own)
router.get('/user/:userId', [authenticate, authorizeRole(['admin', 'teacher'])], async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }
    
    // Check if user is admin or requesting their own fines
    if (user?.role !== 'admin' && userId !== user?.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const fines = await Fine.find({ user: userId })
      .sort({ date: -1 })
      .populate('user', 'firstName lastName');
      
    res.json({ fines });
  } catch (error) {
    console.error('Error fetching fines:', error);
    res.status(500).json({ message: 'Ошибка при получении штрафов' });
  }
});

// Delete a fine (Admin only)
router.delete('/:id', [authenticate, authorizeRole(['admin'])], async (req: Request, res: Response) => {
  try {
    const fine = await Fine.findByIdAndDelete(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ message: 'Штраф не найден' });
    }
    
    res.json({ message: 'Штраф успешно удален' });
  } catch (error) {
    console.error('Error deleting fine:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении штрафа',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

export default router;
