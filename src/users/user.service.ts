import { Document, Types } from 'mongoose';
import User, { IUser } from './user.model';

// Интерфейс для опций поиска пользователей
export interface UserSearchOptions {
  page?: number;
  limit?: number;
  role?: string;
  active?: boolean;
  groupId?: string;
}

// Сервис для работы с пользователями
export class UserService {
  // Создание нового пользователя
  async createUser(userData: Partial<IUser>): Promise<IUser & Document> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Error creating user: ${error}`);
    }
  }

  // Получение пользователя по ID
  async getUserById(id: string): Promise<(IUser & Document) | null> {
    try {
      return await User.findById(id).populate('groupId');
    } catch (error) {
      throw new Error(`Error getting user by id: ${error}`);
    }
  }

  // Получение пользователя по ID без ошибки
  async getUserByIdSafe(id: string): Promise<(IUser & Document) | null> {
    try {
      return await User.findById(id).select('+initialPassword +passwordHash').populate('groupId');
    } catch (error) {
      return null;
    }
  }

  // Получение пользователя по телефону
  async getUserByPhone(phone: string): Promise<(IUser & Document) | null> {
    try {
      return await User.findOne({ phone }).populate('groupId');
    } catch (error) {
      throw new Error(`Error getting user by phone: ${error}`);
    }
  }

  // Получение списка пользователей с фильтрацией и пагинацией
  async getUsers(options: UserSearchOptions = {}): Promise<{
    users: (IUser & Document)[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10, ...filters } = options;
      const skip = (page - 1) * limit;
      
      // Подготовка фильтров
      const queryFilters: any = {};
      if (filters.role) queryFilters.role = filters.role;
      if (filters.active !== undefined) queryFilters.active = filters.active;
      if (filters.groupId) queryFilters.groupId = new Types.ObjectId(filters.groupId);
      
      const [users, total] = await Promise.all([
        User.find(queryFilters)
          .populate('groupId')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        User.countDocuments(queryFilters)
      ]);

      return {
        users,
        total,
        page,
        limit
      };
    } catch (error) {
      throw new Error(`Error getting users: ${error}`);
    }
 }

  // Обновление пользователя
  async updateUser(id: string, userData: Partial<IUser>): Promise<(IUser & Document) | null> {
    try {
      // Создаем копию данных для преобразования
      const updateData = { ...userData };
      
      // Преобразование типов зарплаты для совместимости с бэкендом
      if (updateData.salaryType === 'day') {
        updateData.salaryType = 'per_day';
      } else if (updateData.salaryType === 'month') {
        updateData.salaryType = 'per_month';
      } else if (updateData.salaryType === 'shift') {
        updateData.salaryType = 'per_shift';
      }
      
      return await User.findByIdAndUpdate(id, updateData, { new: true }).populate('groupId');
    } catch (error) {
      throw new Error(`Error updating user: ${error}`);
    }
}

  // Удаление пользователя
 async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting user: ${error}`);
    }
 }

  // Обновление пароля пользователя
  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndUpdate(id, { 
        passwordHash, 
        initialPassword: undefined // Удаляем временный пароль после установки постоянного
      });
      return !!result;
    } catch (error) {
      throw new Error(`Error updating password: ${error}`);
    }
  }

  // Активация/деактивация пользователя
  async toggleUserActiveStatus(id: string, active: boolean): Promise<(IUser & Document) | null> {
    try {
      return await User.findByIdAndUpdate(id, { active }, { new: true }).populate('groupId');
    } catch (error) {
      throw new Error(`Error toggling user active status: ${error}`);
    }
 }
// Обновление настроек зарплаты и штрафов
  async updatePayrollSettings(id: string, payrollData: Partial<Pick<IUser, 'salary' | 'shiftRate' | 'salaryType' | 'penaltyType' | 'penaltyAmount'>>): Promise<(IUser & Document) | null> {
    try {
      // Создаем копию данных для преобразования
      const updateData: Partial<IUser> = { ...payrollData };
      
      // Преобразование типов зарплаты для совместимости с бэкендом
      if (updateData.salaryType === 'day') {
        updateData.salaryType = 'per_day';
      } else if (updateData.salaryType === 'month') {
        updateData.salaryType = 'per_month';
      } else if (updateData.salaryType === 'shift') {
        updateData.salaryType = 'per_shift';
      }
      
      return await User.findByIdAndUpdate(id, updateData, { new: true }).populate('groupId');
    } catch (error) {
      throw new Error(`Error updating payroll settings: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const userService = new UserService();