import { ObjectId } from 'mongoose';

export interface IChildEntity {
  id?: string;
  fullName: string;
  iin?: string;
  birthday?: Date;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  groupId?: ObjectId;
  active?: boolean;

  gender?: string;
  clinic?: string;
  bloodGroup?: string;
  rhesus?: string;
  disability?: string;
  dispensary?: string;
  diagnosis?: string;
  allergy?: string;
  infections?: string;
  hospitalizations?: string;
  incapacity?: string;
  checkups?: string;

  notes?: string;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ChildEntity {
  id?: string;
  fullName: string;
  iin?: string;
  birthday?: Date;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  groupId?: ObjectId;
  active?: boolean;

  gender?: string;
  clinic?: string;
  bloodGroup?: string;
  rhesus?: string;
  disability?: string;
  dispensary?: string;
  diagnosis?: string;
  allergy?: string;
  infections?: string;
  hospitalizations?: string;
  incapacity?: string;
  checkups?: string;

  notes?: string;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IChildEntity) {
    this.validate(data);

    this.id = data.id;
    this.fullName = data.fullName;
    this.iin = data.iin;
    this.birthday = data.birthday;
    this.address = data.address;
    this.parentName = data.parentName;
    this.parentPhone = data.parentPhone;
    this.groupId = data.groupId;
    this.active = data.active !== undefined ? data.active : true;
    this.gender = data.gender;
    this.clinic = data.clinic;
    this.bloodGroup = data.bloodGroup;
    this.rhesus = data.rhesus;
    this.disability = data.disability;
    this.dispensary = data.dispensary;
    this.diagnosis = data.diagnosis;
    this.allergy = data.allergy;
    this.infections = data.infections;
    this.hospitalizations = data.hospitalizations;
    this.incapacity = data.incapacity;
    this.checkups = data.checkups;
    this.notes = data.notes;
    this.photo = data.photo;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  private validate(data: IChildEntity): void {
    if (!data.fullName) {
      throw new Error('ФИО ребенка обязательно');
    }

    if (data.iin && data.iin.length !== 12) {
      throw new Error('ИИН должен содержать 12 символов');
    }

    if (data.birthday && data.birthday > new Date()) {
      throw new Error('Дата рождения не может быть в будущем');
    }

    if (data.parentPhone && !this.isValidPhone(data.parentPhone)) {
      throw new Error('Некорректный формат номера телефона родителя');
    }
  }

  private isValidPhone(phone: string): boolean {

    const phoneRegex = /^(\+7|8)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  public update(data: Partial<IChildEntity>): void {
    if (data.fullName !== undefined) this.fullName = data.fullName;
    if (data.iin !== undefined) this.iin = data.iin;
    if (data.birthday !== undefined) this.birthday = data.birthday;
    if (data.address !== undefined) this.address = data.address;
    if (data.parentName !== undefined) this.parentName = data.parentName;
    if (data.parentPhone !== undefined) this.parentPhone = data.parentPhone;
    if (data.groupId !== undefined) this.groupId = data.groupId;
    if (data.active !== undefined) this.active = data.active;
    if (data.gender !== undefined) this.gender = data.gender;
    if (data.clinic !== undefined) this.clinic = data.clinic;
    if (data.bloodGroup !== undefined) this.bloodGroup = data.bloodGroup;
    if (data.rhesus !== undefined) this.rhesus = data.rhesus;
    if (data.disability !== undefined) this.disability = data.disability;
    if (data.dispensary !== undefined) this.dispensary = data.dispensary;
    if (data.diagnosis !== undefined) this.diagnosis = data.diagnosis;
    if (data.allergy !== undefined) this.allergy = data.allergy;
    if (data.infections !== undefined) this.infections = data.infections;
    if (data.hospitalizations !== undefined) this.hospitalizations = data.hospitalizations;
    if (data.incapacity !== undefined) this.incapacity = data.incapacity;
    if (data.checkups !== undefined) this.checkups = data.checkups;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.photo !== undefined) this.photo = data.photo;

    this.updatedAt = new Date();
  }

  public getAge(): number {
    if (!this.birthday) return 0;
    const today = new Date();
    const birthDate = new Date(this.birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  public getAgeInMonths(): number {
    if (!this.birthday) return 0;
    const today = new Date();
    const birthDate = new Date(this.birthday);

    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months += today.getMonth() - birthDate.getMonth();

    if (today.getDate() < birthDate.getDate()) {
      months--;
    }

    return months;
  }

  public isActive(): boolean {
    return this.active !== false;
  }

  public isMedicalInfoComplete(): boolean {
    return !!(this.bloodGroup && this.rhesus);
  }
}