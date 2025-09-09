import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  name: string;
  description?: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  breakDuration: number; // minutes
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  color: string; // Hex color for calendar display
  isActive: boolean;
  isDefault: boolean;
  maxStaff?: number; // Maximum staff for this shift
  minStaff?: number; // Minimum staff required
  hourlyRate?: number; // Base hourly rate for this shift
  overtimeMultiplier: number; // Overtime rate multiplier
  kindergartenId?: mongoose.Types.ObjectId; // For multi-location support
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название смены обязательно'],
    trim: true,
    maxlength: [100, 'Название смены не может превышать 100 символов']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, 'Описание не может превышать 500 символов']
  },
  startTime: { 
    type: String, 
    required: [true, 'Время начала смены обязательно'],
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Неверный формат времени. Используйте HH:MM'
    }
  },
  endTime: { 
    type: String, 
    required: [true, 'Время окончания смены обязательно'],
    validate: {
      validator: function(v: string) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Неверный формат времени. Используйте HH:MM'
    }
  },
  breakDuration: { 
    type: Number, 
    default: 30,
    min: [0, 'Продолжительность перерыва не может быть отрицательной'],
    max: [480, 'Продолжительность перерыва не может превышать 8 часов']
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6,
    validate: {
      validator: function(v: number[]) {
        return v.length > 0 && v.every(day => day >= 0 && day <= 6);
      },
      message: 'Дни недели должны быть от 0 (воскресенье) до 6 (суббота)'
    }
  }],
  color: { 
    type: String, 
    default: '#3f51b5',
    validate: {
      validator: function(v: string) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Цвет должен быть в формате HEX (#RRGGBB)'
    }
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  maxStaff: { 
    type: Number,
    min: [1, 'Максимальное количество сотрудников должно быть больше 0']
  },
  minStaff: { 
    type: Number,
    min: [1, 'Минимальное количество сотрудников должно быть больше 0']
  },
  hourlyRate: { 
    type: Number,
    min: [0, 'Почасовая ставка не может быть отрицательной']
  },
  overtimeMultiplier: { 
    type: Number, 
    default: 1.5,
    min: [1, 'Коэффициент сверхурочных не может быть меньше 1']
  },
  kindergartenId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kindergarten'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Indexes for performance
ShiftSchema.index({ isActive: 1, daysOfWeek: 1 });
ShiftSchema.index({ kindergartenId: 1, isActive: 1 });

// Validation: endTime should be after startTime
ShiftSchema.pre('save', function(this: IShift, next) {
  const startMinutes = timeToMinutes(this.startTime);
  const endMinutes = timeToMinutes(this.endTime);
  
  if (endMinutes <= startMinutes) {
    return next(new Error('Время окончания должно быть позже времени начала'));
  }
  
  // Validate minStaff <= maxStaff
  if (this.minStaff && this.maxStaff && this.minStaff > this.maxStaff) {
    return next(new Error('Минимальное количество сотрудников не может превышать максимальное'));
  }
  
  next();
});

// Method to calculate shift duration in hours
ShiftSchema.methods.getDuration = function(): number {
  const startMinutes = timeToMinutes(this.startTime);
  const endMinutes = timeToMinutes(this.endTime);
  const totalMinutes = endMinutes - startMinutes - this.breakDuration;
  return totalMinutes / 60;
};

// Method to check if shift is active on a specific day
ShiftSchema.methods.isActiveOnDay = function(dayOfWeek: number): boolean {
  return this.isActive && this.daysOfWeek.includes(dayOfWeek);
};

// Helper function to convert time string to minutes
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export default mongoose.model<IShift>('Shift', ShiftSchema);
