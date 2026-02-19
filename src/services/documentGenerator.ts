import path from 'path';
import fs from 'fs';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { IChild } from '.././entities/children/model';

export async function generateDocx(templateName: string, user: IChild | null, date: string, extra: Record<string, any> = {}) {
  // Защита от path traversal: разрешаем только буквы, цифры, дефис и подчёркивание
  if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
    throw new Error('Недопустимое имя шаблона');
  }

  const templatesDir = path.resolve(__dirname, '../../templates');
  const templatePath = path.join(templatesDir, `${templateName}.docx`);

  // Дополнительная проверка: путь не должен выходить за пределы директории шаблонов
  if (!templatePath.startsWith(templatesDir)) {
    throw new Error('Недопустимый путь к шаблону');
  }

  const content = await fs.promises.readFile(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });


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
