import { ObjectId } from 'mongoose';

export interface IPayrollEntity {
  id?: string;
  staffId: ObjectId;
  period: string; // Format: YYYY-MM
  baseSalary: number;
  bonuses: number;
  deductions: number;
  advance?: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  accruals?: number;
  baseSalaryType: string; // 'fixed', 'hourly', 'daily', 'monthly'
  shiftRate?: number;
  workedDays?: number;
  workedShifts?: number;
  history?: any[]; // Payment history
  createdAt?: Date;
  updatedAt?: Date;
}

export class PayrollEntity {
  id?: string;
  staffId: ObjectId;
  period: string;
 baseSalary: number;
  bonuses: number;
  deductions: number;
  advance: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  accruals: number;
  baseSalaryType: string;
 shiftRate: number;
  workedDays: number;
  workedShifts: number;
  history: any[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IPayrollEntity) {
    this.validate(data);
    
    this.id = data.id;
    this.staffId = data.staffId;
    this.period = data.period;
    this.baseSalary = data.baseSalary || 0;
    this.bonuses = data.bonuses || 0;
    this.deductions = data.deductions || 0;
    this.advance = data.advance || 0;
    this.total = this.calculateTotal();
    this.status = data.status || 'draft';
    this.paymentDate = data.paymentDate;
    this.accruals = data.accruals || this.baseSalary;
    this.baseSalaryType = data.baseSalaryType || 'monthly';
    this.shiftRate = data.shiftRate || 0;
    this.workedDays = data.workedDays || 0;
    this.workedShifts = data.workedShifts || 0;
    this.history = data.history || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private validate(data: IPayrollEntity): void {
    if (!data.staffId) {
      throw new Error('ID сотрудника обязателен');
    }
    
    if (!data.period) {
      throw new Error('Период начисления обязателен');
    }
    
    // Проверяем формат периода (YYYY-MM)
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(data.period)) {
      throw new Error('Некорректный формат периода. Используйте формат YYYY-MM');
    }
    
    if (data.baseSalary !== undefined && data.baseSalary < 0) {
      throw new Error('Базовая зарплата не может быть отрицательной');
    }
    
    if (data.bonuses !== undefined && data.bonuses < 0) {
      throw new Error('Бонусы не могут быть отрицательными');
    }
    
    if (data.deductions !== undefined && data.deductions < 0) {
      throw new Error('Вычеты не могут быть отрицательными');
    }
    
    if (data.advance !== undefined && data.advance < 0) {
      throw new Error('Аванс не может быть отрицательным');
    }
    
    const validStatuses = ['draft', 'approved', 'paid'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`);
    }
    
    const validSalaryTypes = ['fixed', 'hourly', 'daily', 'monthly'];
    if (data.baseSalaryType && !validSalaryTypes.includes(data.baseSalaryType)) {
      throw new Error(`Недопустимый тип оплаты. Допустимые значения: ${validSalaryTypes.join(', ')}`);
    }
  }

  private calculateTotal(): number {
    return this.baseSalary + this.bonuses - this.deductions - (this.advance || 0);
  }

  public update(data: Partial<IPayrollEntity>): void {
    if (data.baseSalary !== undefined) this.baseSalary = data.baseSalary;
    if (data.bonuses !== undefined) this.bonuses = data.bonuses;
    if (data.deductions !== undefined) this.deductions = data.deductions;
    if (data.advance !== undefined) this.advance = data.advance;
    if (data.status !== undefined) this.status = data.status;
    if (data.paymentDate !== undefined) this.paymentDate = data.paymentDate;
    if (data.accruals !== undefined) this.accruals = data.accruals;
    if (data.baseSalaryType !== undefined) this.baseSalaryType = data.baseSalaryType;
    if (data.shiftRate !== undefined) this.shiftRate = data.shiftRate;
    if (data.workedDays !== undefined) this.workedDays = data.workedDays;
    if (data.workedShifts !== undefined) this.workedShifts = data.workedShifts;
    
    this.total = this.calculateTotal();
    this.updatedAt = new Date();
  }

  public approve(): void {
    this.status = 'approved';
    this.updatedAt = new Date();
  }

  public markAsPaid(): void {
    this.status = 'paid';
    this.paymentDate = new Date();
    this.updatedAt = new Date();
  }

  public isDraft(): boolean {
    return this.status === 'draft';
  }

  public isApproved(): boolean {
    return this.status === 'approved';
  }

  public isPaid(): boolean {
    return this.status === 'paid';
  }

  public getNetSalary(): number {
    return this.total;
  }

 public getGrossSalary(): number {
    return this.baseSalary + this.bonuses;
  }

  public getDeductionTotal(): number {
    return this.deductions + (this.advance || 0);
  }

  public addHistoryEntry(entry: any): void {
    this.history.push({
      ...entry,
      timestamp: new Date(),
    });
  }
}