import { Document } from 'mongoose';

export interface IBaseEntity extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IBaseEntityWithId extends Document {
  _id: string;
  createdAt: Date;
 updatedAt: Date;
}