import mongoose, { Schema, Document } from 'mongoose';

export interface IKindergartenSettings extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  workingDays: string[]; // ['monday', 'tuesday', etc.]
  timezone: string;
  language: string;
  currency: string;
  logo?: string; // Path to logo file
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface INotificationSettings extends Document {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lateArrivalAlert: boolean;
  absenceAlert: boolean;
  overtimeAlert: boolean;
  reportReminders: boolean;
  emailSettings?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail?: string;
  };
  smsSettings?: {
    provider?: string;
    apiKey?: string;
    fromNumber?: string;
  };
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface ISecuritySettings extends Document {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number; // in minutes
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface IGeolocationSettings extends Document {
  enabled: boolean;
  radius: number; // in meters
  coordinates: {
    latitude: number;
    longitude: number;
  };
  strictMode: boolean;
  allowedDevices: string[];
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

// Kindergarten Settings Schema
const KindergartenSettingsSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название детского сада обязательно'],
    trim: true,
    maxlength: [200, 'Название не может превышать 200 символов']
  },
  address: {
    type: String,
    required: [true, 'Адрес обязателен'],
    trim: true,
    maxlength: [500, 'Адрес не может превышать 500 символов']
  },
  phone: {
    type: String,
    required: [true, 'Телефон обязателен'],
    trim: true,
    validate: {
      validator: function(phone: string) {
        return /^\+?[1-9]\d{1,14}$/.test(phone);
      },
      message: 'Некорректный номер телефона'
    }
  },
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Некорректный email адрес'
    }
  },
  director: {
    type: String,
    required: [true, 'ФИО директора обязательно'],
    trim: true,
    maxlength: [200, 'ФИО директора не может превышать 200 символов']
  },
  workingHours: {
    start: {
      type: String,
      required: [true, 'Время начала работы обязательно'],
      validate: {
        validator: function(time: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Неверный формат времени (HH:MM)'
      }
    },
    end: {
      type: String,
      required: [true, 'Время окончания работы обязательно'],
      validate: {
        validator: function(time: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Неверный формат времени (HH:MM)'
      }
    }
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  timezone: {
    type: String,
    required: [true, 'Часовой пояс обязателен'],
    default: 'Asia/Almaty'
  },
  language: {
    type: String,
    required: [true, 'Язык обязателен'],
    enum: ['ru', 'kk', 'en'],
    default: 'ru'
  },
  currency: {
    type: String,
    required: [true, 'Валюта обязательна'],
    default: 'KZT'
  },
  logo: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Пользователь, обновивший настройки, обязателен']
  }
}, { 
  timestamps: true 
});

// Notification Settings Schema
const NotificationSettingsSchema: Schema = new Schema({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  lateArrivalAlert: {
    type: Boolean,
    default: true
  },
  absenceAlert: {
    type: Boolean,
    default: true
  },
  overtimeAlert: {
    type: Boolean,
    default: false
  },
  reportReminders: {
    type: Boolean,
    default: true
  },
  emailSettings: {
    smtpHost: String,
    smtpPort: {
      type: Number,
      min: [1, 'Порт должен быть больше 0'],
      max: [65535, 'Порт должен быть меньше 65536']
    },
    smtpUser: String,
    smtpPassword: String,
    fromEmail: {
      type: String,
      validate: {
        validator: function(email: string) {
          return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Некорректный email адрес'
      }
    }
  },
  smsSettings: {
    provider: String,
    apiKey: String,
    fromNumber: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Пользователь, обновивший настройки, обязателен']
  }
}, { 
  timestamps: true 
});

// Security Settings Schema
const SecuritySettingsSchema: Schema = new Schema({
  passwordPolicy: {
    minLength: {
      type: Number,
      required: [true, 'Минимальная длина пароля обязательна'],
      min: [4, 'Минимальная длина пароля должна быть не менее 4 символов'],
      max: [128, 'Минимальная длина пароля не может превышать 128 символов'],
      default: 8
    },
    requireUppercase: {
      type: Boolean,
      default: true
    },
    requireLowercase: {
      type: Boolean,
      default: true
    },
    requireNumbers: {
      type: Boolean,
      default: true
    },
    requireSpecialChars: {
      type: Boolean,
      default: false
    }
  },
  sessionTimeout: {
    type: Number,
    required: [true, 'Таймаут сессии обязателен'],
    min: [5, 'Таймаут сессии должен быть не менее 5 минут'],
    max: [1440, 'Таймаут сессии не может превышать 24 часа'],
    default: 60
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(ip: string) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
      },
      message: 'Некорректный IP адрес'
    }
  }],
  maxLoginAttempts: {
    type: Number,
    required: [true, 'Максимальное количество попыток входа обязательно'],
    min: [1, 'Должна быть хотя бы одна попытка входа'],
    max: [20, 'Слишком много попыток входа'],
    default: 5
  },
  lockoutDuration: {
    type: Number,
    required: [true, 'Длительность блокировки обязательна'],
    min: [1, 'Длительность блокировки должна быть не менее 1 минуты'],
    max: [1440, 'Длительность блокировки не может превышать 24 часа'],
    default: 15
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Пользователь, обновивший настройки, обязателен']
  }
}, { 
  timestamps: true 
});

// Geolocation Settings Schema
const GeolocationSettingsSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  radius: {
    type: Number,
    required: [true, 'Радиус обязателен'],
    min: [10, 'Радиус должен быть не менее 10 метров'],
    max: [10000, 'Радиус не может превышать 10 км'],
    default: 100
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
  strictMode: {
    type: Boolean,
    default: false
  },
  allowedDevices: [{
    type: String,
    trim: true
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Пользователь, обновивший настройки, обязателен']
  }
}, { 
  timestamps: true 
});

// Индексы
KindergartenSettingsSchema.index({ updatedAt: -1 });
NotificationSettingsSchema.index({ updatedAt: -1 });
SecuritySettingsSchema.index({ updatedAt: -1 });
GeolocationSettingsSchema.index({ updatedAt: -1 });

export const KindergartenSettings = mongoose.model<IKindergartenSettings>('KindergartenSettings', KindergartenSettingsSchema);
export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
export const SecuritySettings = mongoose.model<ISecuritySettings>('SecuritySettings', SecuritySettingsSchema);
export const GeolocationSettings = mongoose.model<IGeolocationSettings>('GeolocationSettings', GeolocationSettingsSchema);
