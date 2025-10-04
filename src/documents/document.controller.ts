import { Request, Response, NextFunction } from 'express';
import { documentService } from './document.service';

export class DocumentController {
  // === Documents ===
  
  // Получение списка документов
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId, documentType, status, createdBy, search } = req.query;
      
      const filter: any = {};
      if (templateId) filter.templateId = templateId;
      if (documentType) filter.documentType = documentType;
      if (status) filter.status = status;
      if (createdBy) filter.createdBy = createdBy;
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      
      const documents = await documentService.getDocuments(filter);
      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  }

  // Получение документа по ID
  async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ success: false, message: 'Документ не найден' });
      }
      
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового документа
  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const documentData = {
        ...req.body,
        createdBy: user._id
      };
      
      const document = await documentService.createDocument(documentData);
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // Обновление документа
  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const documentData = {
        ...req.body,
        updatedBy: user._id
      };
      
      const updated = await documentService.updateDocument(id, documentData);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Документ не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление документа
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await documentService.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Документ не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Document Templates ===
  
  // Получение списка шаблонов документов
  async getDocumentTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isActive, search } = req.query;
      
      const filter: any = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const templates = await documentService.getDocumentTemplates(filter);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  // Получение шаблона документа по ID
  async getDocumentTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await documentService.getDocumentTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ success: false, message: 'Шаблон документа не найден' });
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового шаблона документа
  async createDocumentTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const templateData = {
        ...req.body,
        createdBy: user._id
      };
      
      const template = await documentService.createDocumentTemplate(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  // Обновление шаблона документа
  async updateDocumentTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const templateData = {
        ...req.body,
        updatedBy: user._id
      };
      
      const updated = await documentService.updateDocumentTemplate(id, templateData);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Шаблон документа не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление шаблона документа
  async deleteDocumentTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await documentService.deleteDocumentTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Шаблон документа не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Document Generation ===
  
  // Генерация документа из шаблона
  async generateDocumentFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params;
      const { variables } = req.body;
      const user = (req as any).user;
      
      if (!variables) {
        return res.status(400).json({ success: false, message: 'Необходимо указать переменные' });
      }
      
      const document = await documentService.generateDocumentFromTemplate(templateId, variables, user._id);
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // === Document Signing ===
  
  // Подписание документа
  async signDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const document = await documentService.signDocument(id, user._id);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // === Document Approval ===
  
  // Утверждение документа
  async approveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const document = await documentService.approveDocument(id, user._id);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // === Document Archiving ===
  
  // Архивирование документа
  async archiveDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const document = await documentService.archiveDocument(id);
      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  // === Document Statistics ===
  
  // Получение статистики документов
  async getDocumentStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await documentService.getDocumentStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // === Document Search ===
  
  // Поиск документов по названию
  async searchDocumentsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const documents = await documentService.searchDocumentsByName(term as string);
      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  }

  // Поиск шаблонов документов по названию
  async searchDocumentTemplatesByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const templates = await documentService.searchDocumentTemplatesByName(term as string);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  // === Document Cleanup ===
  
  // Удаление устаревших документов
  async cleanupExpiredDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await documentService.cleanupExpiredDocuments();
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const documentController = new DocumentController();