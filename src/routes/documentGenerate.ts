import express from 'express';
import { Request, Response } from 'express';
import Users from '../models/Users';
import { generateDocx } from '../services/documentGenerator';
import { generateJournalExcel } from '../services/excelGenerator';
import { generateCertificatePDF } from '../services/pdfGenerator';
import { generateJournalPDF } from '../services/pdfJournalGenerator';
import path from 'path';

const router = express.Router();

// POST /api/documents/generate
router.post('/', async (req: Request, res: Response) => {
  try {
    const { template, userId, date, extra = {}, format = 'docx', entries = [] } = req.body;
    const user = userId ? await Users.findById(userId) : null;
    if (userId && !user) return res.status(404).json({ message: 'Пользователь не найден' });

    let fileBuffer: Buffer;
    let filename = '';
    let mimeType = '';

    if (format === 'xlsx') {
      // Excel журнал
      fileBuffer = await generateJournalExcel(template, date, entries);
      filename = `${template}_journal_${date}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'pdf' && entries && entries.length > 0) {
      // PDF журнал (таблица)
      fileBuffer = await generateJournalPDF(template, date, entries);
      filename = `${template}_journal_${date}.pdf`;
      mimeType = 'application/pdf';
    } else if (format === 'pdf') {
      // PDF справка
      fileBuffer = await generateCertificatePDF({
        fullName: user?.fullName || extra.fullName || '',
        birthday: user?.birthday ? user.birthday.toLocaleDateString() : extra.birthday,
        parentName: user?.parentName || extra.parentName,
        date,
        reason: extra.reason
      });
      filename = `${template}_${user?.fullName || 'certificate'}_${date}.pdf`;
      mimeType = 'application/pdf';
    } else {
      // DOCX (по умолчанию)
      fileBuffer = await generateDocx(template, user, date, extra);
      filename = `${template}_${user?.fullName || 'document'}_${date}.docx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
    });
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка генерации документа', error: error?.toString() });
  }
});

export default router;
