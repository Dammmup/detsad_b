import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../users/user.model';
import { Document } from 'mongoose';

// Тип для пользователя в ответе login, без Mongoose специфичных свойств
export interface IUserResponse {
  _id: any;
 fullName: string;
 phone: string;
 role: string;
 active: boolean;
 photo?: string;
  birthday?: Date | any;
  notes?: string;
  salary?: number;
  salaryType?: 'day' | 'month' | 'shift' | 'per_day' | 'per_month' | 'per_shift';
  shiftRate?: number;
  penaltyType?: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes';
  penaltyAmount?: number;
  totalFines?: number;
  latePenalties?: {
    minutes: number;
    amount: number;
    details: Array<{
      date: Date | any;
      minutes: number;
      amount: number;
      reason?: string;
    }>;
  };
  isVerified?: boolean;
  avatarUrl?: string;
  groupId?: any;
  iin?: string;
  permissions?: string[];
  username?: string;
  parentPhone?: string;
  parentName?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
  lastLogin?: Date | any;
}

export interface ILoginResult {
  user: IUserResponse;
  token: string;
}

export interface IRegisterResult {
 user: IUser;
  token: string;
}

export interface ITokenPayload {
  userId: string;
  role: string;
}

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;

 constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '24h';
  }

  public async register(userData: { username: string; phone: string; password: string; role?: string }): Promise<IRegisterResult> {
    try {
      // Проверяем, существует ли пользователь с таким телефоном или username
      const existingUser = await User.findOne({
        $or: [
          { phone: userData.phone },
          { fullName: userData.username }
        ]
      });

      if (existingUser) {
        throw new Error('Пользователь с таким телефоном или username уже существует');
      }

      // Хешируем пароль
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Создаем нового пользователя
      const user = new User({
        fullName: userData.username,
        phone: userData.phone,
        // Для совместимости с существующей моделью, создаем email на основе телефона
        email: `${userData.phone}@default.com`,
        passwordHash: hashedPassword,
        role: userData.role || 'teacher',
        active: true
      });

      const savedUser = await user.save();

      // Генерируем токен
      const token = this.generateToken((savedUser._id as any).toString(), savedUser.role);

      return { user: savedUser, token };
    } catch (error) {
      throw error;
    }
  }

 public async login(phone: string, passwordHash: string): Promise<ILoginResult> {
  try {
    // Находим пользователя по телефону
    const user = await User.findOne({ phone });

    if (!user) {
      throw new Error('Неверные учетные данные');
    }

    // Проверяем, активен ли пользователь
    if (!user.active) {
      throw new Error('Аккаунт пользователя деактивирован');
    }

    // Сравниваем пароли
    if (!user.passwordHash) {
      throw new Error('Пользователь не имеет установленного пароля');
    }
    const isPasswordValid = await bcrypt.compare(passwordHash, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Неверные учетные данные');
    }

    // Генерируем токен
    const token = this.generateToken((user._id as any).toString(), user.role);

    // Создаем объект пользователя без passwordHash для возврата
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      active: user.active,
      photo: user.photo,
      birthday: user.birthday,
      notes: user.notes,
      salary: user.salary,
      salaryType: user.salaryType,
      shiftRate: user.shiftRate,
      penaltyType: user.penaltyType,
      penaltyAmount: user.penaltyAmount,
      totalFines: user.totalFines,
      latePenalties: user.latePenalties,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      groupId: user.groupId,
      iin: user.iin,
      permissions: user.permissions,
      username: user.username,
      parentPhone: user.parentPhone,
      parentName: user.parentName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    };

    return { user: userResponse, token };
  } catch (error) {
    throw error;
  }
}


  public async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  public async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Проверяем старый пароль
      if (!user.passwordHash) {
        throw new Error('Пользователь не имеет установленного пароля');
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

      if (!isPasswordValid) {
        throw new Error('Старый пароль неверен');
      }

      // Хешируем новый пароль
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Обновляем пароль
      user.passwordHash = hashedNewPassword;
      await user.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  public async updateProfile(userId: string, profileData: Partial<IUser>): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: profileData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  private generateToken(userId: string, role: string): string {
    const payload: ITokenPayload = { userId, role };
    // Используем стандартный формат JWT для expiresIn (например, '24h', '7d', '1y')
    // jwt библиотека сама обрабатывает строковые форматы
    const options = { expiresIn: this.jwtExpiration };
    return jwt.sign(payload, this.jwtSecret!, options as jwt.SignOptions);
  }

  public verifyToken(token: string): ITokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as ITokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();