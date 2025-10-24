import { Request, Response } from 'express';
import { UIStateService } from './service';
import { UIStateRequest } from './model';

export const saveUIState = async (req: Request, res: Response) => {
  try {
    const uiStateData: UIStateRequest = req.body;

    // Валидация обязательных полей
    if (!uiStateData.sessionId || !uiStateData.url || !uiStateData.route) {
      return res.status(400).json({ error: 'sessionId, url и route обязательны' });
    }

    const result = await UIStateService.saveUIState(uiStateData);
    res.status(201).json(result);
 } catch (error: any) {
    console.error('Ошибка в контроллере сохранения состояния UI:', error);
    res.status(500).json({ error: error.message || 'Внутренняя ошибка сервера' });
  }
};

export const getLastUIState = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId обязателен' });
    }

    const result = await UIStateService.getLastUIState(sessionId);
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Состояние UI не найдено' });
    }
  } catch (error: any) {
    console.error('Ошибка в контроллере получения последнего состояния UI:', error);
    res.status(500).json({ error: error.message || 'Внутренняя ошибка сервера' });
  }
};

export const getUIStateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'id обязателен' });
    }

    const result = await UIStateService.getUIStateById(id);
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Состояние UI не найдено' });
    }
  } catch (error: any) {
    console.error('Ошибка в контроллере получения состояния UI по ID:', error);
    res.status(500).json({ error: error.message || 'Внутренняя ошибка сервера' });
  }
};