import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unit: string;
}

export interface IDish extends Document {
    name: string;
    description?: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    subcategory?: 'soup' | 'main' | 'porridge' | 'salad' | 'drink' | 'baking' | 'garnish' | 'other';
    ingredients: IIngredient[];
    servingsCount: number;
    preparationTime?: number; // в минутах
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const IngredientSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Продукт обязателен']
    },
    quantity: {
        type: Number,
        required: [true, 'Количество обязательно'],
        min: [0, 'Количество не может быть отрицательным']
    },
    unit: {
        type: String,
        required: [true, 'Единица измерения обязательна'],
        trim: true
    }
}, { _id: false });

const DishSchema = new Schema<IDish>({
    name: {
        type: String,
        required: [true, 'Название блюда обязательно'],
        trim: true,
        maxlength: [100, 'Название не может превышать 100 символов']
    },
    description: {
        type: String,
        maxlength: [500, 'Описание не может превышать 500 символов']
    },
    category: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: [true, 'Категория обязательна'],
        index: true
    },
    subcategory: {
        type: String,
        enum: ['soup', 'main', 'porridge', 'salad', 'drink', 'baking', 'garnish', 'other'],
        default: 'other',
        index: true
    },
    ingredients: [IngredientSchema],
    servingsCount: {
        type: Number,
        required: [true, 'Количество порций обязательно'],
        min: [1, 'Количество порций должно быть не менее 1'],
        default: 1
    },
    preparationTime: {
        type: Number,
        min: [0, 'Время приготовления не может быть отрицательным']
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model<IDish>('Dish', DishSchema, 'dishes');
