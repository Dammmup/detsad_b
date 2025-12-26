import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleBlock {
    order: number;
    time?: string;
    activityType: string;
    templateId?: mongoose.Types.ObjectId;
    content: string;
    topic?: string;
    goal?: string;
}

export interface IDailySchedule extends Document {
    groupId: mongoose.Types.ObjectId;
    date: Date;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    weekNumber?: number;
    blocks: IScheduleBlock[];
    createdBy: mongoose.Types.ObjectId;
    isTemplate: boolean;
    templateName?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ScheduleBlockSchema = new Schema<IScheduleBlock>({
    order: {
        type: Number,
        required: true,
        default: 0
    },
    time: {
        type: String,
        trim: true
    },
    activityType: {
        type: String,
        required: true,
        trim: true
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityTemplate'
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        trim: true
    },
    goal: {
        type: String,
        trim: true
    }
}, { _id: false });

const DailyScheduleSchema = new Schema<IDailySchedule>({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    weekNumber: {
        type: Number
    },
    blocks: [ScheduleBlockSchema],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateName: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

DailyScheduleSchema.index({ groupId: 1, date: 1 }, { unique: true });
DailyScheduleSchema.index({ isTemplate: 1 });

export default mongoose.model<IDailySchedule>('DailySchedule', DailyScheduleSchema, 'daily_schedules');
