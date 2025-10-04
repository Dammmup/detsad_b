import mongoose, { Schema, Document, Date } from 'mongoose';

export interface IMenuItem extends Document {
  name: string; // Название блюда
  category: 'first_course' | 'second_course' | 'salad' | 'dessert' | 'drink' | 'snack' | 'soup' | 'side_dish';
  description?: string; // Описание блюда
  ingredients: string[]; // Ингредиенты
  nutritionalValue?: {
    calories?: number;
    proteins?: number;
    fats?: number;
    carbohydrates?: number;
  }; // Пищевая ценность
  allergens?: string[]; // Аллергены
  recommendedAge?: string; // Рекомендуемый возраст
  preparationTime?: number; // Время приготовления в минутах
  isActive: boolean; // Активно ли блюдо
  photo?: string; // Фото блюда
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название блюда обязательно'],
    trim: true,
    maxlength: [100, 'Название блюда не может превышать 100 символов']
  },
  category: {
    type: String,
    required: [true, 'Категория блюда обязательна'],
    enum: ['first_course', 'second_course', 'salad', 'dessert', 'drink', 'snack', 'soup', 'side_dish'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание блюда не может превышать 500 символов']
  },
  ingredients: [{
    type: String,
    maxlength: [100, 'Ингредиент не может превышать 100 символов']
  }],
  nutritionalValue: {
    calories: { type: Number },
    proteins: { type: Number },
    fats: { type: Number },
    carbohydrates: { type: Number }
  },
  allergens: [{
    type: String,
    maxlength: [50, 'Аллерген не может превышать 50 символов']
  }],
  recommendedAge: { 
    type: String,
    maxlength: [50, 'Рекомендуемый возраст не может превышать 50 символов']
  },
  preparationTime: { 
    type: Number,
    min: 0,
    max: 1440 // 24 часа максимум
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  photo: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model<IMenuItem>('menuItems', MenuItemSchema);