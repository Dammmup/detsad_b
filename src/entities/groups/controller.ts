import { Request, Response } from 'express';
import { GroupService } from './service';

const groupService = new GroupService();

export const getAllGroups = async (req: Request, res: Response) => {
  try {
    // Admin sees all groups, teachers see only their groups
    const filter = req.user?.role === 'admin' ? undefined : req.user?.id;
    const groups = await groupService.getAll(filter, req.user?.role);
    
    // Временно убираем populate teacher, чтобы избежать ошибок с моделью
    console.log('📋 Загружен список групп:', groups.length, 'групп(ы)');
    
    res.json(groups);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in GET /groups:', errorMessage);
    res.status(500).json({ 
      error: 'Ошибка при получении списка групп',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const group = await groupService.getById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    console.log('📄 Загружена группа:', group.name);
    
    res.json(group);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error in GET /groups/${req.params.id}:`, errorMessage);
    res.status(500).json({ 
      error: 'Ошибка при получении данных группы',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    console.log('📥 Получен запрос на создание группы:', req.body);
    console.log('👤 Текущий пользователь:', req.user);
    
    const group = await groupService.create(req.body, req.user?.id as string);
    
    console.log('✅ Группа успешно создана:', group.name);
    res.status(201).json(group);
    
  } catch (err) {
    const error = err as Error;
    console.error('❌ Ошибка создания группы:', error.message);
    res.status(400).json({ error: error.message });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const group = await groupService.getById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Проверка прав доступа (только админ или создатель группы)
    if (req.user?.role !== 'admin' && group.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования группы' });
    }

    const updatedGroup = await groupService.update(req.params.id, req.body);
    
    res.json(updatedGroup);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const group = await groupService.getById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Проверка прав доступа (только админ или создатель группы)
    if (
      req.user?.role !== 'admin' &&
      (!group.createdBy || group.createdBy.toString() !== req.user?.id)
    ) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления группы' });
    }

    const result = await groupService.delete(req.params.id);
    if (result) {
      res.json({ message: 'Группа успешно удалена' });
    } else {
      res.status(50).json({ error: 'Ошибка при удалении группы' });
    }
 } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};