import mongoose from 'mongoose';
import { connectDatabases } from '../src/config/database';
import createUserModel from '../src/entities/users/model';
import { IUser } from '../src/entities/users/model';

export const runMigration = async () => {
  try {
    console.log('Starting tenant to rent role migration...');


    await connectDatabases();


    const User = createUserModel();


    const usersWithTenant = await User.find({ tenant: true });

    console.log(`Found ${usersWithTenant.length} users with tenant flag set to true`);


    for (const user of usersWithTenant) {
      console.log(`Updating user ${user.fullName} (ID: ${user._id}) role to 'rent'`);
      user.role = 'rent';
      await user.save();
    }


    await User.updateMany({}, { $unset: { tenant: "" } });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {

    await mongoose.disconnect();
  }
};


export default runMigration;