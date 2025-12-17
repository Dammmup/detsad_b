import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../../config/database';

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink';
  dayOfWeek: number;
  weekNumber: number;
  ingredients: string[];
  nutritionalInfo: {
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
  };
  allergens: string[];
  price?: number;
  isAvailable: boolean;
  image?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'],
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    index: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    index: true
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  nutritionalInfo: {
    calories: Number,
    proteins: Number,
    fats: Number,
    carbs: Number
  },
  allergens: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  image: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});




const createMenuItemModel = createModelFactory<IMenuItem>(
  'MenuItem',
  MenuItemSchema,
  'menu_items',
  'food'
);

export default createMenuItemModel;