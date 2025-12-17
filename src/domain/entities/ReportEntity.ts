import { ObjectId } from 'mongoose';

export interface IReportEntity {
  id?: string;
  title: string;
  description?: string;
  type: string;
  data: any;
  generatedBy: ObjectId;
  generatedAt?: Date;
  filters: any;
  format: 'pdf' | 'excel' | 'csv';
  filePath?: string;
  fileName?: string;
  status: 'draft' | 'generated' | 'sent';
  recipients?: string[];
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReportEntity {
  id?: string;
  title: string;
  description?: string;
  type: string;
  data: any;
  generatedBy: ObjectId;
  generatedAt?: Date;
  filters: any;
  format: 'pdf' | 'excel' | 'csv';
  filePath?: string;
  fileName?: string;
  status: 'draft' | 'generated' | 'sent';
  recipients?: string[];
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IReportEntity) {
    this.validate(data);

    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type;
    this.data = data.data;
    this.generatedBy = data.generatedBy;
    this.generatedAt = data.generatedAt || new Date();
    this.filters = data.filters;
    this.format = data.format;
    this.filePath = data.filePath;
    this.fileName = data.fileName;
    this.status = data.status;
    this.recipients = data.recipients;
    this.sentAt = data.sentAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private validate(data: IReportEntity): void {
    if (!data.title) {
      throw new Error('Заголовок отчета обязателен');
    }

    if (!data.type) {
      throw new Error('Тип отчета обязателен');
    }

    if (!data.generatedBy) {
      throw new Error('Автор отчета обязателен');
    }

    const validTypes = ['attendance', 'payroll', 'inventory', 'medical', 'financial', 'custom'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`Недопустимый тип отчета. Допустимые значения: ${validTypes.join(', ')}`);
    }

    const validFormats = ['pdf', 'excel', 'csv'];
    if (data.format && !validFormats.includes(data.format)) {
      throw new Error(`Недопустимый формат. Допустимые значения: ${validFormats.join(', ')}`);
    }

    const validStatuses = ['draft', 'generated', 'sent'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`);
    }
  }

  public update(data: Partial<IReportEntity>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.type !== undefined) this.type = data.type;
    if (data.data !== undefined) this.data = data.data;
    if (data.filters !== undefined) this.filters = data.filters;
    if (data.format !== undefined) this.format = data.format;
    if (data.filePath !== undefined) this.filePath = data.filePath;
    if (data.fileName !== undefined) this.fileName = data.fileName;
    if (data.status !== undefined) this.status = data.status;
    if (data.recipients !== undefined) this.recipients = data.recipients;
    if (data.sentAt !== undefined) this.sentAt = data.sentAt;

    this.updatedAt = new Date();
  }

  public generate(): void {
    this.status = 'generated';
    this.generatedAt = new Date();
  }

  public send(recipients: string[]): void {
    this.recipients = recipients;
    this.sentAt = new Date();
    this.status = 'sent';
  }

  public isGenerated(): boolean {
    return this.status === 'generated' || this.status === 'sent';
  }

  public isSent(): boolean {
    return this.status === 'sent';
  }
}