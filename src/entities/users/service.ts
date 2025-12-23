import User, { IUser } from './model';
import { comparePassword, hashPassword } from '../../utils/hash';
import { cacheService } from '../../services/cache';

const CACHE_KEY_PREFIX = 'users';
const CACHE_TTL = 3600; // 1 hour

export class UserService {
  async getAll(includePasswords: boolean = false): Promise<IUser[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}:all:${includePasswords}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const projection = includePasswords ? '+passwordHash +initialPassword' : '-passwordHash -initialPassword';
      const query: any = { role: { $ne: 'admin' } };
      return await User.find(query).select(projection).lean();
    }, CACHE_TTL);
  }

  async getById(id: string): Promise<IUser | null> {
    const cacheKey = `${CACHE_KEY_PREFIX}:${id}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      return await User.findById(id).select('-passwordHash').lean();
    }, CACHE_TTL);
  }

  async getByPhone(phone: string): Promise<IUser | null> {
    const cacheKey = `${CACHE_KEY_PREFIX}:phone:${phone}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      return await User.findOne({ phone }).select('-passwordHash -initialPassword').lean();
    }, CACHE_TTL);
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }
    const user = new User(data);
    const savedUser = await user.save();
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return savedUser;
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    if ((data as any).password) {
      (data as any).password = await hashPassword((data as any).password);
    }

    if ((data as any).initialPassword !== undefined) {
      // Handle initial password
    }
    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true }).select('-passwordHash');
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return !!result;
  }

  async validatePassword(phone: string, password: string): Promise<IUser | null> {
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) return null;

    const isValid = await comparePassword(password, user.passwordHash || (user as any).password as any);
    return isValid ? user : null;
  }
}