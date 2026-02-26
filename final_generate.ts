
import mongoose from 'mongoose';
import { PayrollService } from './src/entities/payroll/service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected.');

    const service = new PayrollService();
    console.log('Generating payroll sheets for 2026-02...');
    const result = await service.ensurePayrollRecordsForPeriod('2026-02', true);
    console.log('Result:', result);

    await mongoose.disconnect();
    console.log('Disconnected.');
}

run().catch(console.error);
