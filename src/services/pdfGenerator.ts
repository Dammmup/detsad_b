import PDFDocument from 'pdfkit';

interface CertificateData {
  fullName: string;
  birthday?: string;
  parentName?: string;
  date: string;
  reason?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    doc.fontSize(18).text('Справка', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Выдана: ${data.fullName}`);
    if (data.birthday) doc.text(`Дата рождения: ${data.birthday}`);
    if (data.parentName) doc.text(`Родитель: ${data.parentName}`);
    doc.text(`Дата: ${data.date}`);
    if (data.reason) doc.text(`Причина: ${data.reason}`);
    doc.end();
  });
}
