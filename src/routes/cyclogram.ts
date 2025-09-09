import express, { Request, Response } from 'express';
import Cyclogram, { ICyclogram } from '../models/Cyclogram';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Get all cyclograms with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { groupId, teacherId, ageGroup, status } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (groupId) filter.groupId = groupId;
    if (teacherId) filter.teacherId = teacherId;
    if (ageGroup) filter.ageGroup = ageGroup;
    if (status) filter.status = status;
    
    const cyclograms = await Cyclogram.find(filter)
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(cyclograms);
  } catch (error) {
    console.error('Error fetching cyclograms:', error);
    res.status(500).json({ error: 'Ошибка при получении циклограмм' });
  }
});

// Get a single cyclogram by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cyclogram = await Cyclogram.findById(req.params.id)
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    if (!cyclogram) {
      return res.status(404).json({ error: 'Циклограмма не найдена' });
    }
    
    res.json(cyclogram);
  } catch (error) {
    console.error('Error fetching cyclogram:', error);
    res.status(500).json({ error: 'Ошибка при получении циклограммы' });
  }
});

// Create a new cyclogram
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cyclogramData = {
      ...req.body,
      createdBy: req.user.id
    };

    const cyclogram = new Cyclogram(cyclogramData);
    await cyclogram.save();
    
    const populatedCyclogram = await Cyclogram.findById(cyclogram._id)
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    res.status(201).json(populatedCyclogram);
  } catch (error) {
    console.error('Error creating cyclogram:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при создании циклограммы' });
  }
});

// Update an existing cyclogram
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cyclogram = await Cyclogram.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    if (!cyclogram) {
      return res.status(404).json({ error: 'Циклограмма не найдена' });
    }
    
    res.json(cyclogram);
  } catch (error) {
    console.error('Error updating cyclogram:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении циклограммы' });
  }
});

// Delete a cyclogram
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cyclogram = await Cyclogram.findByIdAndDelete(req.params.id);
    
    if (!cyclogram) {
      return res.status(404).json({ error: 'Циклограмма не найдена' });
    }
    
    res.json({ message: 'Циклограмма успешно удалена' });
  } catch (error) {
    console.error('Error deleting cyclogram:', error);
    res.status(500).json({ error: 'Ошибка при удалении циклограммы' });
  }
});

// Get cyclogram templates (predefined cyclograms)
router.get('/templates/list', async (req: Request, res: Response) => {
  try {
    const { ageGroup } = req.query;
    
    // Build filter for templates (cyclograms with status 'template')
    const filter: any = { status: 'template' };
    if (ageGroup) filter.ageGroup = ageGroup;
    
    const templates = await Cyclogram.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching cyclogram templates:', error);
    res.status(500).json({ error: 'Ошибка при получении шаблонов циклограмм' });
  }
});

// Create cyclogram from template
router.post('/from-template/:templateId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const template = await Cyclogram.findById(req.params.templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    
    const { title, groupId, teacherId, weekStartDate } = req.body;
    
    // Create new cyclogram based on template
    const newCyclogram = new Cyclogram({
      title,
      description: `Создано из шаблона: ${template.title}`,
      ageGroup: template.ageGroup,
      groupId,
      teacherId,
      weekStartDate,
      timeSlots: template.timeSlots.map(slot => ({
        ...slot.toObject(),
        groupId,
        teacherId
      })),
      status: 'draft',
      createdBy: req.user.id
    });
    
    await newCyclogram.save();
    
    const populatedCyclogram = await Cyclogram.findById(newCyclogram._id)
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    res.status(201).json(populatedCyclogram);
  } catch (error) {
    console.error('Error creating cyclogram from template:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при создании циклограммы из шаблона' });
  }
});

// Duplicate a cyclogram
router.post('/:id/duplicate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const originalCyclogram = await Cyclogram.findById(req.params.id);
    
    if (!originalCyclogram) {
      return res.status(404).json({ error: 'Циклограмма не найдена' });
    }
    
    const { title, weekStartDate } = req.body;
    
    // Create duplicate
    const duplicatedCyclogram = new Cyclogram({
      ...originalCyclogram.toObject(),
      _id: undefined,
      title: title || `${originalCyclogram.title} (копия)`,
      weekStartDate: weekStartDate || originalCyclogram.weekStartDate,
      status: 'draft',
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    await duplicatedCyclogram.save();
    
    const populatedCyclogram = await Cyclogram.findById(duplicatedCyclogram._id)
      .populate('groupId', 'name description')
      .populate('teacherId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    res.status(201).json(populatedCyclogram);
  } catch (error) {
    console.error('Error duplicating cyclogram:', error);
    res.status(500).json({ error: 'Ошибка при дублировании циклограммы' });
  }
});

export default router;
