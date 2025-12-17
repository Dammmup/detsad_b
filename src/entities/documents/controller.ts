import { Request, Response } from 'express';
import { DocumentsService } from './service';

const documentsService = new DocumentsService();

export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ownerId, category, isPublic, tags } = req.query;

    const documents = await documentsService.getAll({
      ownerId: ownerId as string,
      category: category as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      tags: tags ? (tags as string).split(',') : undefined
    });

    res.json(documents);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Ошибка получения документов' });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const document = await documentsService.getById(req.params.id);
    res.json(document);
  } catch (err: any) {
    console.error('Error fetching document:', err);
    res.status(404).json({ error: err.message || 'Документ не найден' });
  }
};


interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export const createDocument = async (req: Request & { file?: MulterFile }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const documentData: any = { ...req.body };


    if (req.file) {
      documentData.fileName = req.file.originalname;
      documentData.filePath = req.file.path;
      documentData.fileType = req.file.mimetype;
      documentData.fileSize = req.file.size;
    }


    documentData.owner = req.user.id;

    const document = await documentsService.create(documentData);
    res.status(201).json(document);
  } catch (err: any) {
    console.error('Error creating document:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания документа' });
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const document = await documentsService.update(req.params.id, req.body);
    res.json(document);
  } catch (err: any) {
    console.error('Error updating document:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления документа' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await documentsService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting document:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления документа' });
  }
};

export const searchDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { q, ownerId, category } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Не указан поисковый запрос' });
    }

    const documents = await documentsService.search(
      q as string,
      { ownerId: ownerId as string, category: category as string }
    );

    res.json(documents);
  } catch (err: any) {
    console.error('Error searching documents:', err);
    res.status(500).json({ error: err.message || 'Ошибка поиска документов' });
  }
};


export const downloadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const document = await documentsService.getById(req.params.id);


    if (!document.filePath) {
      return res.status(404).json({ error: 'Файл документа не найден' });
    }


    res.download(document.filePath, document.fileName, (err) => {
      if (err) {
        console.error('Error downloading document:', err);
        res.status(500).json({ error: 'Ошибка загрузки файла документа' });
      }
    });
  } catch (err: any) {
    console.error('Error downloading document:', err);
    res.status(404).json({ error: err.message || 'Документ не найден' });
  }
};

export const getDocumentsByCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { category } = req.params;
    const { ownerId } = req.query;

    const documents = await documentsService.getByCategory(
      category,
      ownerId as string
    );

    res.json(documents);
  } catch (err: any) {
    console.error('Error fetching documents by category:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения документов по категории' });
  }
};