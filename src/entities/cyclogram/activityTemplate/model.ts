import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
    | 'reception'           // Прием детей
    | 'parents_work'        // Работа с родителями
    | 'independent_activity'// Самостоятельная деятельность
    | 'morning_gymnastics'  // Утренняя гимнастика
    | 'breakfast'           // Завтрак
    | 'preparation_OD'      // Подготовка к ОД
    | 'OD'                  // Организованная деятельность
    | 'second_breakfast'    // Второй завтрак
    | 'walk'                // Прогулка
    | 'return_from_walk'    // Возвращение с прогулки
    | 'lunch'               // Обед
    | 'day_sleep'           // Дневной сон
    | 'awakening'           // Пробуждение
    | 'snack'               // Полдник
    | 'evening_activity'    // Вечерняя деятельность
    | 'home_departure'      // Уход домой
    | 'other';              // Другое

export interface IActivityTemplate extends Document {
    name: string;
    type: ActivityType;
    category: string;
    content: string;
    goal?: string;
    ageGroups: string[];
    duration?: number;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityTemplateSchema = new Schema<IActivityTemplate>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Название не может превышать 200 символов']
    },
    type: {
        type: String,
        required: true,
        enum: [
            'reception', 'parents_work', 'independent_activity', 'morning_gymnastics',
            'breakfast', 'preparation_OD', 'OD', 'second_breakfast', 'walk',
            'return_from_walk', 'lunch', 'day_sleep', 'awakening', 'snack',
            'evening_activity', 'home_departure', 'other'
        ],
        index: true
    },
    category: {
        type: String,
        trim: true,
        maxlength: [100, 'Категория не может превышать 100 символов']
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    goal: {
        type: String,
        trim: true
    },
    ageGroups: [{
        type: String,
        enum: ['1 год', '2 года', '3 года', '4 года', '5 лет', 'предшкола', 'все']
    }],
    duration: {
        type: Number,
        min: 0
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

ActivityTemplateSchema.index({ type: 1, ageGroups: 1 });

export default mongoose.model<IActivityTemplate>('ActivityTemplate', ActivityTemplateSchema, 'activity_templates');
