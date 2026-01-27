import { IUser } from '../users/model';
import User from '../users/model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from '../../utils/hash';

export class AuthService {
  private get userModel() {
    return User;
  }
  private createJwtToken(user: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET не установлен в переменных окружения!');
      throw new Error('Server configuration error');
    }
    return jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone
      },
      secret,
      { expiresIn: '30d' }
    );
  }

  async login(phone: string, password: string) {
    // Нормализация входящего номера: удаляем всё кроме цифр и плюса
    const normalizedPhone = (phone || '').replace(/[^\d+]/g, '');

    // Пробуем найти пользователя сначала по точному совпадению, затем по нормализованному номеру
    let user = await this.userModel.findOne({
      $or: [
        { phone: phone || '' },
        { phone: normalizedPhone }
      ]
    }).select('+initialPassword +passwordHash').maxTimeMS(5000);

    // Если не нашли, пробуем найти всех и сравнить нормализованные версии (для случаев, когда в БД пробелы, а вводят без них)
    if (!user && normalizedPhone) {
      // Ищем пользователей, у которых номер похож (содержит те же цифры в конце)
      const partialPhone = normalizedPhone.slice(-10);
      const candidates = await this.userModel.find({
        phone: { $regex: partialPhone }
      }).select('+initialPassword +passwordHash').maxTimeMS(5000);

      user = candidates.find(u => (u.phone || '').replace(/[^\d+]/g, '') === normalizedPhone) || null;
    }

    if (!user) {
      throw new Error('No account with this data');
    }

    let isAuthenticated = false;



    const targetHash = user.passwordHash || user.password;


    if (targetHash && targetHash.startsWith('$2')) {
      const isMatch = await bcrypt.compare(password, targetHash);
      if (isMatch) {
        isAuthenticated = true;
      }
    }


    if (!isAuthenticated && user.initialPassword) {
      if (password === user.initialPassword) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      throw new Error('incorrect password');
    }


    user.lastLogin = new Date();
    await user.save();

    const token = this.createJwtToken(user);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone
      },
      token
    };
  }

  async validateToken(token: string) {
    if (!token) {
      throw new Error('Токен не предоставлен');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      const user = await this.userModel.findById(decoded.id).maxTimeMS(5000);

      if (!user || !user.active) {
        throw new Error('Пользователь не найден или неактивен');
      }

      return { valid: true, user: { id: user._id, fullName: user.fullName, role: user.role, active: user.active, allowToSeePayroll: user.allowToSeePayroll } };
    } catch (error) {
      console.error('❌ Ошибка валидации токена:', error);
      throw new Error('Недействительный токен');
    }
  }

  async logout() {


    return { success: true, message: 'Успешный выход из системы' };
  }
}