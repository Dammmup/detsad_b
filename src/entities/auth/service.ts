import { IUser } from '../users/model';
import User from '../users/model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from '../../utils/hash';

export class AuthService {
  private get userModel() {
    return User();
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
        phone: user.phone,
        iat: Math.floor(Date.now() / 1000)
      },
      secret,
      { expiresIn: '24h' }
    );
 }

  async login(phone: string, password: string) {
    const user = await this.userModel.findOne({ phone: phone || '' }).select('+initialPassword');
    if (!user) {
      throw new Error('No account with this data');
    }
    
    let isAuthenticated = false;
    
    // Проверяем пароль с использованием bcrypt, если passwordHash существует
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        isAuthenticated = true;
      }
    }
    
    // Если не прошла проверка по passwordHash, пробуем проверить initialPassword
    if (!isAuthenticated && user.initialPassword) {
      if (password === user.initialPassword) {
        isAuthenticated = true;
      }
    }
    
    if (!isAuthenticated) {
      throw new Error('incorrect password');
    }
    
    // Обновляем время последнего входа
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
      const user = await this.userModel.findById(decoded.id);
      
      if (!user || !user.active) {
        throw new Error('Пользователь не найден или неактивен');
      }
      
      return { valid: true, user: { id: user._id, fullName: user.fullName, role: user.role, active: user.active } };
    } catch (error) {
      console.error('❌ Ошибка валидации токена:', error);
      throw new Error('Недействительный токен');
    }
  }

  async logout() {
    // В сервисе аутентификации logout не требует специфической логики
    // Обработка происходит на уровне контроллера
    return { success: true, message: 'Успешный выход из системы' };
  }
}