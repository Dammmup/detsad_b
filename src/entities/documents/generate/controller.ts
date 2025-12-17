import { Request, Response } from 'express';
import { generateDocx } from '../../../services/documentGenerator';
import { AuthenticatedRequest } from '../../../types/express';
import Child from '../../children/model';

export const generateDocument = async (req: Request, res: Response) => {
  try {
    const { templateName, childId, date, extra } = req.body;

    if (!templateName || !date) {
      return res.status(400).json({ error: 'Требуется указать templateName и date' });
    }

    let user = null;
    if (childId) {
      user = await Child.findById(childId);
      if (!user) {
        return res.status(404).json({ error: 'Ребенок не найден' });
      }
    }

    const buffer = await generateDocx(templateName, user, date, extra);


    const tempFileName = `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.docx`;
    const tempFilePath = `/tmp/${tempFileName}`;



    res.json({
      message: 'Документ успешно сгенерирован',
      fileName: tempFileName,
      filePath: tempFilePath
    });
  } catch (error) {
    console.error('Ошибка генерации документа:', error);
    res.status(500).json({ error: 'Ошибка генерации документа' });
  }
};

export const downloadGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;



    res.status(404).json({ error: 'Файл не найден' });
  } catch (error) {
    console.error('Ошибка загрузки документа:', error);
    res.status(500).json({ error: 'Ошибка загрузки документа' });
  }
};