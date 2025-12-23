import mongoose, { Schema, Document } from 'mongoose';

export interface IDayMeals {
    breakfast: mongoose.Types.ObjectId[];
    lunch: mongoose.Types.ObjectId[];
    snack: mongoose.Types.ObjectId[];
    dinner: mongoose.Types.ObjectId[];
}

export interface IWeeklyMenuTemplate extends Document {
    name: string;
    description?: string;
    days: {
        monday: IDayMeals;
        tuesday: IDayMeals;
        wednesday: IDayMeals;
        thursday: IDayMeals;
        friday: IDayMeals;
        saturday: IDayMeals;
        sunday: IDayMeals;
    };
    defaultChildCount: number;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DayMealsSchema = new Schema({
    breakfast: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }],
    lunch: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }],
    snack: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }],
    dinner: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }]
}, { _id: false });

const WeeklyMenuTemplateSchema = new Schema<IWeeklyMenuTemplate>({
    name: {
        type: String,
        required: [true, 'Название шаблона обязательно'],
        trim: true,
        maxlength: [100, 'Название не может превышать 100 символов']
    },
    description: {
        type: String,
        maxlength: [500, 'Описание не может превышать 500 символов']
    },
    days: {
        monday: DayMealsSchema,
        tuesday: DayMealsSchema,
        wednesday: DayMealsSchema,
        thursday: DayMealsSchema,
        friday: DayMealsSchema,
        saturday: DayMealsSchema,
        sunday: DayMealsSchema
    },
    defaultChildCount: {
        type: Number,
        required: [true, 'Количество детей по умолчанию обязательно'],
        min: [1, 'Количество детей должно быть не менее 1'],
        default: 30
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

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = typeof WEEKDAYS[number];

export default mongoose.model<IWeeklyMenuTemplate>('WeeklyMenuTemplate', WeeklyMenuTemplateSchema, 'weekly_menu_templates');
