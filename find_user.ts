import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
    await mongoose.connect(process.env.MONGO_URI!);

    const { PayrollService } = await import('./src/entities/payroll/service');
    const service = new PayrollService();

    console.log('Generating new payroll for Damir...');
    await service.ensurePayrollForUser('693f1415cbcaf05d27ffc207', '2026-02', true);

    console.log('Done!');
    await mongoose.disconnect();
}
run().catch(console.error);
