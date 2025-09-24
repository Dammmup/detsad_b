import PDFDocument from 'pdfkit';

interface JournalEntry {
  time: string;
  value: string;
  staffName: string;
  notes?: string;
}

export async function generateJournalPDF(journalName: string, date: string, entries: JournalEntry[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    doc.fontSize(16).text(journalName, { align: 'center' });
    doc.fontSize(12).text(`Дата: ${date}`, { align: 'center' });
    doc.moveDown();

    // Заголовки таблицы
    const tableTop = doc.y;
    const colWidths = [100, 100, 150, 140];
    const headers = ['Время/Смена', 'Значение', 'Сотрудник', 'Примечание'];
    let x = doc.x;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').text(h, x, tableTop, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    doc.moveDown(0.5);

    // Данные
    let y = tableTop + 20;
    entries.forEach(entry => {
      let x = doc.x;
      doc.font('Helvetica').text(entry.time, x, y, { width: colWidths[0] });
      x += colWidths[0];
      doc.text(entry.value, x, y, { width: colWidths[1] });
      x += colWidths[1];
      doc.text(entry.staffName, x, y, { width: colWidths[2] });
      x += colWidths[2];
      doc.text(entry.notes || '', x, y, { width: colWidths[3] });
      y += 20;
    });
    doc.end();
  });
}
