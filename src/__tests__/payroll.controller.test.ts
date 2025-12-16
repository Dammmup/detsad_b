import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import User from '../src/entities/users/model';
import Payroll from "../src/entities/payroll/model";
import { generateToken } from '../src/utils/auth';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Payroll Controller', () => {
  let user1, user2, token1, token2, payroll;

  beforeEach(async () => {
    // Clear existing data
    await Payroll.deleteMany({});
    await User.deleteMany({});

    // Create test users
    user1 = await User.create({
      phone: '1234567890',
      password: 'password',
      role: 'teacher',
      fullName: 'Test User 1'
    });
    
    user2 = await User.create({
      phone: '0987654321',
      password: 'password',
      role: 'teacher',
      fullName: 'Test User 2'
    });

    // Generate JWT tokens
    token1 = generateToken(user1._id.toString());
    token2 = generateToken(user2._id.toString());

    // Create a payroll record for user2
    payroll = await Payroll.create({
      staffId: user2._id,
      period: '2025-12',
      baseSalary: 180000,
      status: 'draft'
    });
  });

  afterEach(async () => {
    await Payroll.deleteMany({});
    await User.deleteMany({});
  });

  it('should allow user to access their own payroll', async () => {
    const res = await request(app)
      .get(`/payroll/${payroll._id}`)
      .set('Authorization', `Bearer ${token2}`);
    
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(payroll._id.toString());
  });

  it('should reject another user accessing payroll', async () => {
    const res = await request(app)
      .get(`/payroll/${payroll._id}`)
      .set('Authorization', `Bearer ${token1}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden: Payroll record does not belong to user');
  });

  it('should allow admin to access any payroll', async () => {
    // Create admin user
    const adminUser = await User.create({
      phone: 'admin123',
      password: 'adminpass',
      role: 'admin',
      fullName: 'Admin User'
    });
    const adminToken = generateToken(adminUser._id.toString());

    const res = await request(app)
      .get(`/payroll/${payroll._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});