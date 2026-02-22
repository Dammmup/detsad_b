import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodStaffDailyLog extends Document {
    staffId: mongoose.Types.ObjectId;
    date: Date;
    hasPustularDiseases: boolean; // Осмотр на наличие гнойничковых заболеваний
    hasAnginaSymptoms: boolean; // Осмотр на наличие признаков ангины, ОРВИ
    familyHealthy: boolean; // Сведения об отсутствии инфекционных заболеваний в семье
    healthStatus: 'healthy' | 'unfit'; // Результат: допущен / не допущен
    signature: boolean; // Личная подпись (флаг)
    notes?: string;
    doctor: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const FoodStaffDailyLogSchema = new Schema<IFoodStaffDailyLog>({
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Сотрудник обязателен'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Дата обязательна'],
        index: true
    },
    hasPustularDiseases: {
        type: Boolean,
        default: false
    },
    hasAnginaSymptoms: {
        type: Boolean,
        default: false
    },
    familyHealthy: {
        type: Boolean,
        default: true
    },
    healthStatus: {
        type: String,
        enum: ['healthy', 'unfit'],
        default: 'healthy'
    },
    signature: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: [500, 'Заметки не могут превышать 500 символов']
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Врач (или ответственное лицо) обязателен']
    }
}, {
    timestamps: true
});

// Индекс для уникальности записи на одну дату для одного сотрудника
FoodStaffDailyLogSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model<IFoodStaffDailyLog>('FoodStaffDailyLog', FoodStaffDailyLogSchema, 'food_staff_daily_logs');
