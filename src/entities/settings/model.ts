import mongoose, { Schema, Document } from 'mongoose';

export interface IKindergartenSettings extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  holidays: string[];
  timezone: string;
  language: string;
  currency: string;
  payroll?: {
    latePenaltyRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationSettings extends Document {
  telegram_chat_id: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lateArrivalAlert: boolean;
  absenceAlert: boolean;
  overtimeAlert: boolean;
  reportReminders: boolean;
  createdAt: Date;
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
  sessionTimeout: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeolocationSettings extends Document {
  enabled: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  yandexApiKey?: string;
  strictMode: boolean;
  allowedDevices: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KindergartenSettingsSchema = new Schema<IKindergartenSettings>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  director: { type: String, required: true },
  workingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  workingDays: [{ type: String, required: true }],
  holidays: [{ type: String }],
  timezone: { type: String, required: true, default: 'Asia/Almaty' },
  language: { type: String, required: true, default: 'ru' },
  currency: { type: String, required: true, default: 'KZT' }
}, {
  timestamps: true
});

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  telegram_chat_id: { type: String, default: null },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  lateArrivalAlert: { type: Boolean, default: true },
  absenceAlert: { type: Boolean, default: true },
  overtimeAlert: { type: Boolean, default: true },
  reportReminders: { type: Boolean, default: true }
}, {
  timestamps: true
});

const SecuritySettingsSchema = new Schema<ISecuritySettings>({
  passwordPolicy: {
    minLength: { type: Number, default: 8 },
    requireUppercase: { type: Boolean, default: true },
    requireLowercase: { type: Boolean, default: true },
    requireNumbers: { type: Boolean, default: true },
    requireSpecialChars: { type: Boolean, default: false }
  },
  sessionTimeout: { type: Number, default: 60 },
  twoFactorAuth: { type: Boolean, default: false },
  ipWhitelist: [{ type: String }],
  maxLoginAttempts: { type: Number, default: 5 }
}, {
  timestamps: true
});

const GeolocationSettingsSchema = new Schema<IGeolocationSettings>({
  enabled: { type: Boolean, default: false },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, required: true, default: 100 },
  yandexApiKey: { type: String },
  strictMode: { type: Boolean, default: false },
  allowedDevices: [{ type: String, default: [] }]
}, {
  timestamps: true
});

export const KindergartenSettings = mongoose.model<IKindergartenSettings>('KindergartenSettings', KindergartenSettingsSchema, 'kindergarten_settings');
export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema, 'notification_settings');
export const SecuritySettings = mongoose.model<ISecuritySettings>('SecuritySettings', SecuritySettingsSchema, 'security_settings');
export const GeolocationSettings = mongoose.model<IGeolocationSettings>('GeolocationSettings', GeolocationSettingsSchema, 'geolocation_settings');