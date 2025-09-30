import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import Document from '../models/Document';
import DocumentTemplate from '../models/DocumentTemplate';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';
import { AuthUser } from '../types/express';

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    // Создаем директорию если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB лимит
  },
  fileFilter: (req, file, cb) => {
    // Разрешенные типы файлов
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла') as any, false);
    }
  }
});
// GET /documents - Получение списка документов с фильтрацией
router.get('/', authMiddleware, async (req: Request, res: Response) => {

  try {
    const {
      type,
      category,
      status,
      relatedId,
      relatedType,
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    // Построение фильтра
    const filter: any = {};
    
    if (type && typeof type === 'string') filter.type = type;
    if (category && typeof category === 'string') filter.category = category;
    if (status && typeof status === 'string') filter.status = status;
    if (relatedId && typeof relatedId === 'string' && relatedType && typeof relatedType === 'string') {
      filter.relatedId = relatedId;
      filter.relatedType = relatedType;
    }
    
    // Поиск по названию и описанию
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Получение документов с пагинацией
    const documents = await Document.find(filter)
      .populate('uploader', 'fullName email')
      .populate('relatedId')
      .sort({ uploadDate: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));
    
    // Подсчет общего количества документов
    const total = await Document.countDocuments(filter);
    
    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении документов',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// GET /documents/:id - Получение конкретного документа
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {

  try {
    const document = await Document.findById(req.params.id)
      .populate('uploader', 'fullName email')
      .populate('relatedId');
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Документ не найден' 
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// POST /documents - Создение нового документа с файлом
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
try {
  // Проверка наличия файла
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Файл не был загружен'
    });
  }
  
  // Проверка аутентификации пользователя
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Пользователь не аутентифицирован'
    });
  }
  
  // Создание документа
  const document = new Document({
    ...req.body,
    fileName: req.file.filename,
    fileSize: req.file.size,
    filePath: req.file.path,
    uploadDate: new Date(),
    uploader: req.user!.id
  });

    
    await document.save();
    
    // Популяция связанных данных
    const populatedDocument = await Document.findById(document._id)
      .populate('uploader', 'fullName email')
      .populate('relatedId');
    
    res.status(201).json({
      success: true,
      data: populatedDocument,
      message: 'Документ успешно создан'
    });
  } catch (error) {
    console.error('Error creating document:', error);
    
    // Удаление загруженного файла в случае ошибки
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// PUT /documents/:id - Обновление документа
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {

  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('uploader', 'fullName email')
      .populate('relatedId');
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Документ не найден' 
      });
    }
    
    res.json({
      success: true,
      data: document,
      message: 'Документ успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// DELETE /documents/:id - Удаление документа
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {

  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Документ не найден' 
      });
    }
    
    // Удаление файла с диска
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Удаление записи из базы данных
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Документ успешно удален'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// GET /documents/templates - Получение списка шаблонов документов
router.get('/templates', authMiddleware, async (req: Request, res: Response) => {
try {
  const {
    type,
    category,
    isActive,
    search,
    page = 1,
    limit = 20
  } = req.query;
  
  // Построение фильтра
  const filter: any = {};
  
  if (type && typeof type === 'string') filter.type = type;
  if (category && typeof category === 'string') filter.category = category;
  if (isActive !== undefined && typeof isActive === 'string') filter.isActive = isActive === 'true';
  
  // Поиск по названию и описанию
  if (search && typeof search === 'string') {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

    
    // Получение шаблонов с пагинацией
    const templates = await DocumentTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));
    
    // Подсчет общего количества шаблонов
    const total = await DocumentTemplate.countDocuments(filter);
    
    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching document templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении шаблонов документов',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// POST /documents/templates - Создание нового шаблона документа
router.post('/templates', authMiddleware, authorizeRole(['admin']), upload.single('file'), async (req: Request, res: Response) => {

  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл не был загружен' 
      });
    }
    
    // Создание шаблона
    const template = new DocumentTemplate({
      ...req.body,
      fileName: req.file.filename,
      fileSize: req.file.size,
      filePath: req.file.path
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Шаблон документа успешно создан'
    });
  } catch (error) {
    console.error('Error creating document template:', error);
    
    // Удаление загруженного файла в случае ошибки
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании шаблона документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// PUT /documents/templates/:id - Обновление шаблона документа
router.put('/templates/:id', authMiddleware, authorizeRole(['admin']), async (req: Request, res: Response) => {

  try {
    const template = await DocumentTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Шаблон документа не найден' 
      });
    }
    
    res.json({
      success: true,
      data: template,
      message: 'Шаблон документа успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating document template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении шаблона документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// DELETE /documents/templates/:id - Удаление шаблона документа
router.delete('/templates/:id', authMiddleware, authorizeRole(['admin']), async (req: Request, res: Response) => {

  try {
    const template = await DocumentTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Шаблон документа не найден' 
      });
    }
    
    // Удаление файла с диска
    if (template.filePath && fs.existsSync(template.filePath)) {
      fs.unlinkSync(template.filePath);
    }
    
    // Удаление записи из базы данных
    await DocumentTemplate.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Шаблон документа успешно удален'
    });
  } catch (error) {
    console.error('Error deleting document template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении шаблона документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// GET /documents/templates/:id/download - Скачивание файла шаблона
router.get('/templates/:id/download', authMiddleware, async (req: Request, res: Response) => {

  try {
    const template = await DocumentTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Шаблон документа не найден' 
      });
    }
    
    // Проверка существования файла
    if (!fs.existsSync(template.filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Файл шаблона не найден' 
      });
    }
    
    // Отправка файла
    res.download(template.filePath, template.fileName, (err) => {
      if (err) {
        console.error('Error downloading template file:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Ошибка при скачивании файла шаблона'
        });
      }
    });
  } catch (error) {
    console.error('Error downloading document template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при скачивании шаблона документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// GET /documents/:id/download - Скачивание файла документа
router.get('/:id/download', authMiddleware, async (req: Request, res: Response) => {

  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Документ не найден' 
      });
    }
    
    // Проверка существования файла
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Файл документа не найден' 
      });
    }
    
    // Отправка файла
    res.download(document.filePath, document.fileName, (err) => {
      if (err) {
        console.error('Error downloading document file:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Ошибка при скачивании файла документа'
        });
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при скачивании документа',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
