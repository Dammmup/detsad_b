import Document from './model';
import { IDocument } from './model';

export class DocumentsService {
  async getAll(filters: { ownerId?: string, category?: string, isPublic?: boolean, tags?: string[] }) {
    const filter: any = {};
    
    if (filters.ownerId) filter.owner = filters.ownerId;
    if (filters.category) filter.category = filters.category;
    if (filters.isPublic !== undefined) filter.isPublic = filters.isPublic;
    if (filters.tags && filters.tags.length > 0) {
      filter.tags = { $in: filters.tags };
    }
    
    const documents = await Document.find(filter)
      .populate('owner', 'fullName role')
      .sort({ createdAt: -1 });
    
    return documents;
  }

  async getById(id: string) {
    const document = await Document.findById(id)
      .populate('owner', 'fullName role');
    
    if (!document) {
      throw new Error('Документ не найден');
    }
    
    return document;
  }

  async create(documentData: Partial<IDocument>) {
    // Проверяем обязательные поля
    if (!documentData.title) {
      throw new Error('Не указано название документа');
    }
    if (!documentData.fileName) {
      throw new Error('Не указано имя файла');
    }
    if (!documentData.filePath) {
      throw new Error('Не указан путь к файлу');
    }
    if (!documentData.fileType) {
      throw new Error('Не указан тип файла');
    }
    if (!documentData.fileSize) {
      throw new Error('Не указан размер файла');
    }
    if (!documentData.owner) {
      throw new Error('Не указан владелец документа');
    }
    if (!documentData.category) {
      throw new Error('Не указана категория документа');
    }
    
    const document = new Document(documentData);
    await document.save();
    
    const populatedDocument = await Document.findById(document._id)
      .populate('owner', 'fullName role');
    
    return populatedDocument;
  }

  async update(id: string, data: Partial<IDocument>) {
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('owner', 'fullName role');
    
    if (!updatedDocument) {
      throw new Error('Документ не найден');
    }
    
    return updatedDocument;
  }

  async delete(id: string) {
    const result = await Document.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Документ не найден');
    }
    
    return { message: 'Документ успешно удален' };
  }

  async search(query: string, filters: { ownerId?: string, category?: string }) {
    const searchFilter: any = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };
    
    // Добавляем дополнительные фильтры
    if (filters.ownerId) searchFilter.owner = filters.ownerId;
    if (filters.category) searchFilter.category = filters.category;
    
    const documents = await Document.find(searchFilter)
      .populate('owner', 'fullName role')
      .sort({ createdAt: -1 });
    
    return documents;
  }

  async getByCategory(category: string, ownerId?: string) {
    const filter: any = { category };
    
    if (ownerId) {
      filter.owner = ownerId;
    } else {
      // Если ownerId не указан, показываем только публичные документы
      filter.isPublic = true;
    }
    
    const documents = await Document.find(filter)
      .populate('owner', 'fullName role')
      .sort({ createdAt: -1 });
    
    return documents;
  }
}