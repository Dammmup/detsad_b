import { Response, Request } from 'express';
import { GroupService } from './service';
import { AuthenticatedRequest } from '../../types/express';

const groupService = new GroupService();

export const getAllGroups = async (req: AuthenticatedRequest, res: Response) => {
  try {


    const teacherId = req.query.teacherId as string;
    const isFullAccess = ['admin', 'manager', 'director', 'owner'].includes(req.user?.role || '');
    const filter = isFullAccess ? undefined : (teacherId || req.user?.id);
    const groups = await groupService.getAll(filter, req.user?.role);


    console.log('📋 Загружен список групп:', groups.length, 'групп(ы)');
    console.log('📋 Фильтр: ', filter);
    console.log('📋 teacherId из query: ', teacherId);

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

export const getGroupById = async (req: AuthenticatedRequest, res: Response) => {
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

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
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

export const updateGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const group = await groupService.getById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }


    if (req.user?.role !== 'admin' && group.createdBy && group.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: 'Недостаточно прав для редактирования группы' });
    }

    const updatedGroup = await groupService.update(req.params.id, req.body);

    res.json(updatedGroup);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
};

export const deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const group = await groupService.getById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Группа не найдена' });
    }


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