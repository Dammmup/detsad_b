import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  timestamp: Date;
}

export interface ITimeEntry extends Document {
  userId: mongoose.Types.ObjectId;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakDuration: number; // minutes
  location?: ILocation;
  clockInLocation?: ILocation;
  clockOutLocation?: ILocation;
  status: 'active' | 'completed' | 'missed' | 'pending_approval';
  notes?: string;
  photoClockIn?: string; // URL to photo taken during clock-in
  photoClockOut?: string; // URL to photo taken during clock-out
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema({
  name: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, required: true, default: 100 },
  timestamp: { type: Date, default: Date.now }
});

const TimeEntrySchema: Schema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  clockIn: { 
    type: Date, 
    required: true,
    index: true
  },
  clockOut: { 
    type: Date,
    validate: {
      validator: function(this: ITimeEntry, value: Date) {
        return !value || value > this.clockIn;
      },
      message: 'Clock out time must be after clock in time'
    }
  },
  breakStart: { type: Date },
  breakEnd: { 
    type: Date,
    validate: {
      validator: function(this: ITimeEntry, value: Date) {
        return !value || !this.breakStart || value > this.breakStart;
      },
      message: 'Break end time must be after break start time'
    }
  },
  totalHours: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 24
  },
  regularHours: { 
    type: Number, 
    default: 0,
    min: 0
  },
  overtimeHours: { 
    type: Number, 
    default: 0,
    min: 0
  },
  breakDuration: { 
    type: Number, 
    default: 0,
    min: 0
  },
  location: LocationSchema,
  clockInLocation: LocationSchema,
  clockOutLocation: LocationSchema,
  status: { 
    type: String, 
    enum: ['active', 'completed', 'missed', 'pending_approval'],
    default: 'active',
    index: true
  },
  notes: { 
    type: String,
    maxlength: 500
  },
  photoClockIn: { type: String },
  photoClockOut: { type: String },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  approvedAt: { type: Date },
  isManualEntry: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Indexes for performance
TimeEntrySchema.index({ userId: 1, clockIn: -1 });
TimeEntrySchema.index({ status: 1, clockIn: -1 });
TimeEntrySchema.index({ clockIn: 1, clockOut: 1 });

// Pre-save middleware to calculate hours
TimeEntrySchema.pre('save', function(this: ITimeEntry, next) {
  if (this.clockIn && this.clockOut) {
    const totalMs = this.clockOut.getTime() - this.clockIn.getTime();
    let totalMinutes = Math.floor(totalMs / (1000 * 60));
    
    // Subtract break duration
    if (this.breakDuration) {
      totalMinutes -= this.breakDuration;
    }
    
    this.totalHours = Math.max(0, totalMinutes / 60);
    
    // Calculate regular vs overtime (assuming 8-hour standard)
    const standardHours = 8;
    this.regularHours = Math.min(this.totalHours, standardHours);
    this.overtimeHours = Math.max(0, this.totalHours - standardHours);
    
    // Update status if completed
    if (this.status === 'active') {
      this.status = 'completed';
    }
  }
  next();
});

// Method to check if location is within allowed area
TimeEntrySchema.methods.isLocationValid = function(allowedLocations: ILocation[]) {
  if (!this.clockInLocation) return false;
  
  return allowedLocations.some(location => {
    const distance = calculateDistance(
      this.clockInLocation!.coordinates,
      location.coordinates
    );
    return distance <= location.radius;
  });
};

// Helper function to calculate distance between coordinates
function calculateDistance(coord1: {latitude: number, longitude: number}, coord2: {latitude: number, longitude: number}): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1.latitude * Math.PI/180;
  const φ2 = coord2.latitude * Math.PI/180;
  const Δφ = (coord2.latitude-coord1.latitude) * Math.PI/180;
  const Δλ = (coord2.longitude-coord1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
