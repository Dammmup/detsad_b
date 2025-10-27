import { ObjectId } from 'mongoose';

export interface IChildAttendanceEntity {
  id?: string;
  childId: ObjectId;
  groupId: ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  markedBy: ObjectId; // Teacher or admin who marked attendance
  createdAt?: Date;
 updatedAt?: Date;
}

export class ChildAttendanceEntity {
  id?: string;
  childId: ObjectId;
  groupId: ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  checkInTime?: Date;
 checkOutTime?: Date;
  notes?: string;
  markedBy: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IChildAttendanceEntity) {
    this.validate(data);
    
    this.id = data.id;
    this.childId = data.childId;
    this.groupId = data.groupId;
    this.date = data.date;
    this.status = data.status;
    this.checkInTime = data.checkInTime;
    this.checkOutTime = data.checkOutTime;
    this.notes = data.notes;
    this.markedBy = data.markedBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private validate(data: IChildAttendanceEntity): void {
    if (!data.childId) {
      throw new Error('ID ребенка обязателен');
    }
    
    if (!data.groupId) {
      throw new Error('ID группы обязателен');
    }
    
    if (!data.date) {
      throw new Error('Дата обязательна');
    }
    
    if (!data.status) {
      throw new Error('Статус обязателен');
    }
    
    const validStatuses = ['present', 'absent', 'late', 'sick', 'vacation'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Недопустимый статус. Допустимые значения: ${validStatuses.join(', ')}`);
    }
    
    if (data.checkInTime && data.checkOutTime && data.checkInTime > data.checkOutTime) {
      throw new Error('Время прибытия не может быть позже времени убытия');
    }
 }

  public update(data: Partial<IChildAttendanceEntity>): void {
    if (data.status !== undefined) this.status = data.status;
    if (data.checkInTime !== undefined) this.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) this.checkOutTime = data.checkOutTime;
    if (data.notes !== undefined) this.notes = data.notes;
    
    this.updatedAt = new Date();
  }

  public getDuration(): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    return this.checkOutTime.getTime() - this.checkInTime.getTime();
 }

  public isLate(scheduledTime: string = '08:00'): boolean {
    if (!this.checkInTime || this.status !== 'present') return false;
    
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date(this.date);
    scheduled.setHours(hours, minutes, 0, 0);
    
    return this.checkInTime > scheduled;
  }

  public getAttendanceHours(): number {
    if (!this.checkInTime || !this.checkOutTime) return 0;
    return this.getDuration() / (1000 * 60 * 60); // Convert milliseconds to hours
  }
}