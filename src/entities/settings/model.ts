import mongoose, { Schema, Document } from 'mongoose';

export interface IGeolocationSettings extends Document {
  coordinates: {
    latitude: number;
    longitude: number;
 };
  radius: number; // in meters
  createdAt: Date;
  updatedAt: Date;
}

const GeolocationSettingsSchema = new Schema<IGeolocationSettings>({
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  radius: { type: Number, required: true, default: 100 } // in meters
}, {
  timestamps: true
});

export const GeolocationSettings = mongoose.model<IGeolocationSettings>('GeolocationSettings', GeolocationSettingsSchema, 'geolocation_settings');