import { Document, Types } from 'mongoose';
import DocumentModel, { IDocument } from './document.model';
import DocumentTemplate, { IDocumentTemplate } from './document-template.model';
import User from '../users/user.model';
import Child from '../children/child.model';

// Сервис для работы с документами
export class DocumentService {
  // === Documents ===
  
  // Получение документов с фильтрацией
  async getDocuments(filter: any = {}) {
    try {
      return await DocumentModel.find(filter)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category');
    } catch (error) {
      throw new Error(`Error getting documents: ${error}`);
    }
  }

  // Получение документа по ID
  async getDocumentById(id: string) {
    try {
      return await DocumentModel.findById(id)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category');
    } catch (error) {
      throw new Error(`Error getting document by id: ${error}`);
    }
  }

  // Создание нового документа
  async createDocument(documentData: Partial<IDocument>) {
    try {
      const document = new DocumentModel(documentData);
      return await document.save();
    } catch (error) {
      throw new Error(`Error creating document: ${error}`);
    }
  }

  // Обновление документа
  async updateDocument(id: string, documentData: Partial<IDocument>) {
    try {
      return await DocumentModel.findByIdAndUpdate(id, documentData, { new: true })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category');
    } catch (error) {
      throw new Error(`Error updating document: ${error}`);
    }
  }

  // Удаление документа
  async deleteDocument(id: string) {
    try {
      const result = await DocumentModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting document: ${error}`);
    }
  }

  // === Document Templates ===
  
  // Получение шаблонов документов с фильтрацией
  async getDocumentTemplates(filter: any = {}) {
    try {
      return await DocumentTemplate.find(filter)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting document templates: ${error}`);
    }
  }

  // Получение шаблона документа по ID
  async getDocumentTemplateById(id: string) {
    try {
      return await DocumentTemplate.findById(id)
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting document template by id: ${error}`);
    }
  }

  // Создание нового шаблона документа
  async createDocumentTemplate(templateData: Partial<IDocumentTemplate>) {
    try {
      const template = new DocumentTemplate(templateData);
      return await template.save();
    } catch (error) {
      throw new Error(`Error creating document template: ${error}`);
    }
  }

  // Обновление шаблона документа
  async updateDocumentTemplate(id: string, templateData: Partial<IDocumentTemplate>) {
    try {
      return await DocumentTemplate.findByIdAndUpdate(id, templateData, { new: true })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating document template: ${error}`);
    }
  }

  // Удаление шаблона документа
  async deleteDocumentTemplate(id: string) {
    try {
      const result = await DocumentTemplate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting document template: ${error}`);
    }
  }

  // === Document Generation ===
  
  // Генерация документа из шаблона
  async generateDocumentFromTemplate(templateId: string, variables: Record<string, any>, userId: string) {
    try {
      // Получаем шаблон
      const template = await DocumentTemplate.findById(templateId);
      if (!template) {
        throw new Error('Шаблон документа не найден');
      }
      
      // Проверяем обязательные переменные
      const missingVariables = template.variables
        .filter(v => v.required)
        .map(v => v.name)
        .filter(name => !(name in variables));
      
      if (missingVariables.length > 0) {
        throw new Error(`Отсутствуют обязательные переменные: ${missingVariables.join(', ')}`);
      }
      
      // Создаем документ
      const documentData: Partial<IDocument> = {
        title: template.name,
        description: template.description,
        templateId: template._id as any,
        content: template.content,
        variables,
        documentType: template.category,
        createdBy: userId as any,
        status: 'draft'
      };
      
      const document = new DocumentModel(documentData);
      return await document.save();
    } catch (error) {
      throw new Error(`Error generating document from template: ${error}`);
    }
  }

  // === Document Signing ===
  
  // Подписание документа
  async signDocument(documentId: string, userId: string) {
    try {
      const document = await DocumentModel.findById(documentId);
      if (!document) {
        throw new Error('Документ не найден');
      }
      
      // Добавляем подпись пользователя
      if (!document.signedBy) {
        document.signedBy = [userId as any];
        document.signedAt = [new Date() as any];
      } else if (!document.signedBy.includes(userId as any)) {
        document.signedBy.push(userId as any);
        document.signedAt!.push(new Date() as any);
      }
      
      // Если все подписали, устанавливаем статус "подписан"
      if (document.signedBy.length >= 1) { // Здесь можно добавить логику для нескольких подписей
        document.status = 'signed';
      }
      
      return await document.save();
    } catch (error) {
      throw new Error(`Error signing document: ${error}`);
    }
  }

  // === Document Approval ===
  
  // Утверждение документа
  async approveDocument(documentId: string, userId: string) {
    try {
      const document = await DocumentModel.findByIdAndUpdate(
        documentId,
        {
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date()
        },
        { new: true }
      )
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category');
      
      if (!document) {
        throw new Error('Документ не найден');
      }
      
      return document;
    } catch (error) {
      throw new Error(`Error approving document: ${error}`);
    }
  }

  // === Document Archiving ===
  
  // Архивирование документа
  async archiveDocument(documentId: string) {
    try {
      const document = await DocumentModel.findByIdAndUpdate(
        documentId,
        {
          status: 'archived',
          archivedAt: new Date()
        },
        { new: true }
      )
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category');
      
      if (!document) {
        throw new Error('Документ не найден');
      }
      
      return document;
    } catch (error) {
      throw new Error(`Error archiving document: ${error}`);
    }
  }

  // === Document Statistics ===
  
  // Получение статистики документов
  async getDocumentStatistics() {
    try {
      const totalDocuments = await DocumentModel.countDocuments();
      const draftDocuments = await DocumentModel.countDocuments({ status: 'draft' });
      const signedDocuments = await DocumentModel.countDocuments({ status: 'signed' });
      const approvedDocuments = await DocumentModel.countDocuments({ status: 'approved' });
      const archivedDocuments = await DocumentModel.countDocuments({ status: 'archived' });
      const deletedDocuments = await DocumentModel.countDocuments({ status: 'deleted' });
      
      const totalTemplates = await DocumentTemplate.countDocuments();
      const activeTemplates = await DocumentTemplate.countDocuments({ isActive: true });
      const inactiveTemplates = await DocumentTemplate.countDocuments({ isActive: false });
      
      return {
        documents: {
          total: totalDocuments,
          draft: draftDocuments,
          signed: signedDocuments,
          approved: approvedDocuments,
          archived: archivedDocuments,
          deleted: deletedDocuments
        },
        templates: {
          total: totalTemplates,
          active: activeTemplates,
          inactive: inactiveTemplates
        }
      };
    } catch (error) {
      throw new Error(`Error getting document statistics: ${error}`);
    }
  }

  // === Document Search ===
  
  // Поиск документов по названию
  async searchDocumentsByName(searchTerm: string) {
    try {
      return await DocumentModel.find({
        title: { $regex: searchTerm, $options: 'i' }
      })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('templateId', 'name category')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching documents by name: ${error}`);
    }
  }

  // Поиск шаблонов документов по названию
  async searchDocumentTemplatesByName(searchTerm: string) {
    try {
      return await DocumentTemplate.find({
        name: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching document templates by name: ${error}`);
    }
  }

  // === Document Cleanup ===
  
  // Удаление устаревших документов
  async cleanupExpiredDocuments() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Удаляем документы старше 30 дней
      
      const result = await DocumentModel.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: 'deleted'
      });
      
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Error cleaning up expired documents: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const documentService = new DocumentService();