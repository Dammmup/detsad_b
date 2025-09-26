import path from 'path';
import fs from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { IUser } from '../models/Users';

export async function generateDocx(templateName: string, user: IUser | null, date: string, extra: Record<string, any> = {}) {
  // Путь к шаблону
  const templatePath = path.join(__dirname, '../../templates', `${templateName}.docx`);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  // Формируем данные для шаблона
  const data = {
    fullName: user?.fullName || '',
    parentName: user?.parentName || '',
    parentPhone: user?.parentPhone || '',
    birthday: user?.birthday ? (user.birthday as any).toLocaleDateString ? (user.birthday as any).toLocaleDateString() : user.birthday.toString() : '',
    date,
    ...extra
  };

  doc.setData(data);
  try {
    doc.render();
  } catch (error) {
    throw new Error('Ошибка генерации документа: ' + error);
  }

  const buf = doc.getZip().generate({ type: 'nodebuffer' });
  return buf;
}
