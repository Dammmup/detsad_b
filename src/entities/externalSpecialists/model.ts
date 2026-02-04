
import mongoose, { Schema, Document } from 'mongoose';

export interface IExternalSpecialist extends Document {
    name: string;
    type: 'tenant' | 'speech_therapist' | 'other';
    phone?: string;
    email?: string;
    description?: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExternalSpecialistSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['tenant', 'speech_therapist', 'other'],
        default: 'tenant',
        required: true
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    description: { type: String },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<IExternalSpecialist>('ExternalSpecialist', ExternalSpecialistSchema, 'external_specialists');
