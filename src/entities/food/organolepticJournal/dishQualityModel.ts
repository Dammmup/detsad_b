import mongoose, { Schema, Document } from 'mongoose';

// Simplified model for dish quality assessment (organoleptic evaluation of prepared dishes)
// This is separate from the product inspection model (IOrganolepticJournal)
export interface IDishQualityAssessment extends Document {
    date: Date;
    dish: string;
    group: string;
    appearance: string;
    category?: string;
    subcategory?: string;
    taste: string;
    smell: string;
    decision: string;
    responsibleSignature?: string;
    inspector: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DishQualityAssessmentSchema = new Schema<IDishQualityAssessment>({
    date: {
        type: Date,
        required: true,
        index: true
    },
    dish: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Название блюда не может превышать 200 символов']
    },
    group: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    appearance: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Внешний вид не может превышать 200 символов']
    },
    category: {
        type: String,
        trim: true,
        index: true
    },
    subcategory: {
        type: String,
        trim: true,
        index: true
    },
    taste: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Вкус не может превышать 200 символов']
    },
    smell: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Запах не может превышать 200 символов']
    },
    decision: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Решение не может превышать 200 символов']
    },
    responsibleSignature: {
        type: String,
        trim: true,
        maxlength: [100, 'Подпись не может превышать 100 символов']
    },
    inspector: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});


export default mongoose.model<IDishQualityAssessment>('DishQualityAssessment', DishQualityAssessmentSchema, 'dish_quality_assessments');
