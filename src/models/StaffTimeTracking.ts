import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffTimeTracking extends Document {
  staffId: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  workDuration?: number; // minutes
  breakDuration?: number; // minutes
  overtimeDuration?: number; // minutes
  status: 'checked_in' | 'checked_out' | 'on_break' | 'overtime' | 'absent';
  penalties: {
    late: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    earlyLeave: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    unauthorized: {
      amount: number;
      reason?: string;
    };
  };
  bonuses: {
    overtime: {
      minutes: number;
      amount: number;
    };
    punctuality: {
      amount: number;
      reason?: string;
    };
  };
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StaffTimeTrackingSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shiftId: {
    type: Schema.Types.ObjectId,
    ref: 'StaffShift'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkInTime: Date,
  checkOutTime: Date,
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  workDuration: {
    type: Number,
    default: 0
  },
  breakDuration: {
    type: Number,
    default: 0
  },
  overtimeDuration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out', 'on_break', 'overtime', 'absent'],
    default: 'absent'
  },
  penalties: {
    late: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reason: String
    },
    earlyLeave: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reason: String
    },
    unauthorized: {
      amount: { type: Number, default: 0 },
      reason: String
    }
  },
  bonuses: {
    overtime: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    punctuality: {
      amount: { type: Number, default: 0 },
      reason: String
    }
  },
  notes: String,
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Индексы
StaffTimeTrackingSchema.index({ staffId: 1, date: 1 });
StaffTimeTrackingSchema.index({ date: 1, status: 1 });
StaffTimeTrackingSchema.index({ shiftId: 1 });

// Виртуальные поля
StaffTimeTrackingSchema.virtual('totalPenalties').get(function(this: IStaffTimeTracking) {
  return ((this.penalties as any)?.late?.amount || 0) + 
         ((this.penalties as any)?.earlyLeave?.amount || 0) + 
         ((this.penalties as any)?.unauthorized?.amount || 0);
});

StaffTimeTrackingSchema.virtual('totalBonuses').get(function(this: IStaffTimeTracking) {
  return ((this.bonuses as any)?.overtime?.amount || 0) + 
         ((this.bonuses as any)?.punctuality?.amount || 0);
});

StaffTimeTrackingSchema.virtual('netAdjustment').get(function(this: IStaffTimeTracking) {
  return (this as any).totalBonuses - (this as any).totalPenalties;
});

// Методы для расчетов
StaffTimeTrackingSchema.methods.calculateWorkDuration = function() {
  if (!this.checkInTime || !this.checkOutTime) return 0;
  
  const duration = this.checkOutTime.getTime() - this.checkInTime.getTime();
  return Math.floor(duration / (1000 * 60)) - (this.breakDuration || 0);
};

StaffTimeTrackingSchema.methods.calculateLatePenalty = function(
  startTime: Date, 
  penaltyPerMinute: number = 500
) {
  if (!this.checkInTime || !startTime) return { minutes: 0, amount: 0 };
  
  const lateMinutes = Math.max(0, 
    Math.floor((this.checkInTime.getTime() - startTime.getTime()) / (1000 * 60))
  );
  
  return {
    minutes: lateMinutes,
    amount: lateMinutes * penaltyPerMinute
  };
};

StaffTimeTrackingSchema.methods.calculateEarlyLeavePenalty = function(
  endTime: Date,
  penaltyPerMinute: number = 500
) {
  if (!this.checkOutTime || !endTime) return { minutes: 0, amount: 0 };
  
  const earlyMinutes = Math.max(0,
    Math.floor((endTime.getTime() - this.checkOutTime.getTime()) / (1000 * 60))
  );
  
  return {
    minutes: earlyMinutes,
    amount: earlyMinutes * penaltyPerMinute
  };
};

export default mongoose.model<IStaffTimeTracking>('StaffTimeTracking', StaffTimeTrackingSchema);
