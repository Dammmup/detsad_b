import mongoose, { Schema, Document } from 'mongoose';

export interface IMeal {
    dishes: mongoose.Types.ObjectId[];
    servedAt?: Date;
    childCount: number;
}

export interface IConsumptionLog {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    unit: string;
    consumedAt: Date;
}

export interface IDailyMenu extends Document {
    date: Date;
    meals: {
        breakfast: IMeal;
        lunch: IMeal;
        dinner: IMeal;
        snack: IMeal;
    };
    totalChildCount: number;
    consumptionLogs: IConsumptionLog[];
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MealSchema = new Schema({
    dishes: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }],
    servedAt: {
        type: Date
    },
    childCount: {
        type: Number,
        min: [0, 'Количество детей не может быть отрицательным'],
        default: 0
    }
}, { _id: false });

const ConsumptionLogSchema = new Schema({
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        required: true
    },
    consumedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const DailyMenuSchema = new Schema<IDailyMenu>({
    date: {
        type: Date,
        required: [true, 'Дата обязательна'],
        index: true
    },
    meals: {
        breakfast: MealSchema,
        lunch: MealSchema,
        dinner: MealSchema,
        snack: MealSchema
    },
    totalChildCount: {
        type: Number,
        required: [true, 'Количество детей обязательно'],
        min: [0, 'Количество детей не может быть отрицательным'],
        default: 0
    },
    consumptionLogs: [ConsumptionLogSchema],
    notes: {
        type: String,
        maxlength: [500, 'Заметки не могут превышать 500 символов']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Индекс для уникальности даты

export default mongoose.model<IDailyMenu>('DailyMenu', DailyMenuSchema, 'daily_menus');
