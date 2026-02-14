import User, { IUser } from './model';
import { comparePassword, hashPassword } from '../../utils/hash';


export class UserService {
  async getAll(includePasswords: boolean = false): Promise<IUser[]> {
    const projection = includePasswords ? '+passwordHash +initialPassword' : '-passwordHash -initialPassword';
    const query: any = { role: { $ne: 'admin' } };
    return await User.find(query).select(projection).lean();
  }

  async getById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-passwordHash').lean();
  }

  async getByPhone(phone: string): Promise<IUser | null> {
    return await User.findOne({ phone }).select('-passwordHash -initialPassword').lean();
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }
    const user = new User(data);
    const savedUser = await user.save();
    return savedUser;
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }

    if ((data as any).initialPassword !== undefined) {
      // Handle initial password
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async validatePassword(phone: string, password: string): Promise<IUser | null> {
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) return null;

    const isValid = await comparePassword(password, user.passwordHash || (user as any).password as any);
    return isValid ? user : null;
  }
}