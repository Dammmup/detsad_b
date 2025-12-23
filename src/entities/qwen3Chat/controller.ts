import { Request, Response } from 'express';
import { Qwen3ChatService } from './service';
import { Qwen3Request } from './model';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

export const sendMessage = async (req: Request, res: Response) => {
  console.log('📩 Qwen3Chat: Request received');
  console.log('📩 Body:', JSON.stringify(req.body).substring(0, 200));

  upload.single('image')(req, res, async (err) => {
    console.log('📩 Multer processed');
    if (err) {
      console.log('📩 Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }

    try {
      if (req.file) {
        const body = req.body as any;
        let messages: any[];
        let model: string | undefined;
        let currentPage: string | undefined;

        try {
          messages = JSON.parse(body.messages || '[]');
          model = body.model || 'qwen-vl-max';
          currentPage = body.currentPage;
        } catch (parseError) {
          return res.status(400).json({ error: 'Invalid messages format' });
        }

        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({ error: 'Messages array is required' });
        }

        const qwen3Request: Qwen3Request = {
          messages,
          model,
          currentPage,
          image: req.file,
          sessionId: req.body.sessionId || req.headers['x-session-id'] as string || undefined
        };

        const result = await Qwen3ChatService.sendMessage(qwen3Request);
        res.json(result);
      } else {
        const { messages, model, currentPage } = req.body as Qwen3Request;

        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({ error: 'Messages array is required' });
        }

        const qwen3Request: Qwen3Request = {
          messages,
          model: model || 'qwen-plus',
          currentPage,
          sessionId: req.body.sessionId || req.headers['x-session-id'] as string || undefined
        };

        const result = await Qwen3ChatService.sendMessage(qwen3Request);
        res.json(result);
      }
    } catch (error: any) {
      console.error('Error in Qwen3 chat controller:', error);
      res.status(500).json({
        content: error.message || 'Ошибка при обращении к AI',
        action: 'text',
        error: true
      });
    }
  });
};