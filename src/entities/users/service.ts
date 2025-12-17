import { IUser } from '../users/model';
import { getModel } from '../../config/modelRegistry';
import { comparePassword, hashPassword } from '../../utils/hash';

export class UserService {
  async getAll(includePasswords: boolean = false): Promise<IUser[]> {
    const User = getModel<IUser>('User');
    const projection = includePasswords ? '+passwordHash +initialPassword' : '-passwordHash -initialPassword';
    const query: any = { role: { $ne: 'admin' } };
    return await User.find(query).select(projection);
  }

  async getById(id: string): Promise<IUser | null> {
    const User = getModel<IUser>('User');
    return await User.findById(id).select('-passwordHash');
  }

  async getByPhone(phone: string): Promise<IUser | null> {
    const User = getModel<IUser>('User');
    return await User.findOne({ phone }).select('-passwordHash -initialPassword');
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    const User = getModel<IUser>('User');

    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }
    const user = new User(data);
    return await user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const User = getModel<IUser>('User');

    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }

    if ((data as any).initialPassword !== undefined) {

    }
    return await User.findByIdAndUpdate(id, data, { new: true }).select('-passwordHash');
  }

  async delete(id: string): Promise<boolean> {
    const User = getModel<IUser>('User');
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async validatePassword(phone: string, password: string): Promise<IUser | null> {
    const User = getModel<IUser>('User');
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) return null;

    const isValid = await comparePassword(password, user.passwordHash || (user as any).password as any);
    return isValid ? user : null;
  }
}