import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  description?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  address?: string;
  isActive: boolean;
  isDefault: boolean;
  type: 'main_entrance' | 'classroom' | 'playground' | 'office' | 'kitchen' | 'other';
  allowedRoles: string[]; // Which roles can clock in from this location
  workingHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
    daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  };
  kindergartenId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название локации обязательно'],
    trim: true,
    maxlength: [100, 'Название локации не может превышать 100 символов']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, 'Описание не может превышать 500 символов']
  },
  coordinates: {
    latitude: { 
      type: Number, 
      required: [true, 'Широта обязательна'],
      min: [-90, 'Широта должна быть от -90 до 90'],
      max: [90, 'Широта должна быть от -90 до 90']
    },
    longitude: { 
      type: Number, 
      required: [true, 'Долгота обязательна'],
      min: [-180, 'Долгота должна быть от -180 до 180'],
      max: [180, 'Долгота должна быть от -180 до 180']
    }
  },
  radius: { 
    type: Number, 
    required: [true, 'Радиус обязателен'],
    min: [1, 'Радиус должен быть больше 0'],
    max: [1000, 'Радиус не может превышать 1000 метров'],
    default: 50
  },
  address: { 
    type: String,
    trim: true,
    maxlength: [200, 'Адрес не может превышать 200 символов']
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
  type: { 
    type: String, 
    enum: ['main_entrance', 'classroom', 'playground', 'office', 'kitchen', 'other'],
    default: 'main_entrance',
    index: true
  },
  allowedRoles: [{
    type: String,
    enum: ['admin', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse']
  }],
  workingHours: {
    start: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Неверный формат времени начала. Используйте HH:MM'
      }
    },
    end: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Неверный формат времени окончания. Используйте HH:MM'
      }
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }]
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

// Indexes for geospatial queries
LocationSchema.index({ coordinates: '2dsphere' });
LocationSchema.index({ isActive: 1, type: 1 });
LocationSchema.index({ kindergartenId: 1, isActive: 1 });

// Ensure only one default location per kindergarten
LocationSchema.index(
  { kindergartenId: 1, isDefault: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isDefault: true } 
  }
);

// Method to check if location is active during specific time
LocationSchema.methods.isActiveAt = function(dateTime: Date, userRole: string): boolean {
  if (!this.isActive) return false;
  
  // Check if user role is allowed
  if (this.allowedRoles.length > 0 && !this.allowedRoles.includes(userRole)) {
    return false;
  }
  
  // Check working hours if specified
  if (this.workingHours && this.workingHours.start && this.workingHours.end) {
    const dayOfWeek = dateTime.getDay();
    
    // Check if location is active on this day
    if (this.workingHours.daysOfWeek && this.workingHours.daysOfWeek.length > 0) {
      if (!this.workingHours.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }
    
    // Check time range
    const currentTime = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    const startTime = this.workingHours.start;
    const endTime = this.workingHours.end;
    
    if (currentTime < startTime || currentTime > endTime) {
      return false;
    }
  }
  
  return true;
};

// Method to calculate distance from coordinates
LocationSchema.methods.getDistanceFrom = function(latitude: number, longitude: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = this.coordinates.latitude * Math.PI/180;
  const φ2 = latitude * Math.PI/180;
  const Δφ = (latitude - this.coordinates.latitude) * Math.PI/180;
  const Δλ = (longitude - this.coordinates.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Method to check if coordinates are within radius
LocationSchema.methods.isWithinRadius = function(latitude: number, longitude: number): boolean {
  const distance = this.getDistanceFrom(latitude, longitude);
  return distance <= this.radius;
};

// Static method to find nearby locations
LocationSchema.statics.findNearby = function(
  latitude: number, 
  longitude: number, 
  maxDistance: number = 1000,
  userRole?: string
) {
  const query: any = {
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  };
  
  if (userRole) {
    query.$or = [
      { allowedRoles: { $size: 0 } }, // No role restrictions
      { allowedRoles: userRole }      // Role is allowed
    ];
  }
  
  return this.find(query);
};

export default mongoose.model<ILocation>('Location', LocationSchema);
