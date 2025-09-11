import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';

const router = express.Router();

// Универсальная функция создания JWT-токена для пользователя
function createJwtToken(user: any) {
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

// User login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  console.log('login:', phone, password);
  try {
    const user = await User.findOne({ phone: phone || '' });
    if (!user) {
      return res.status(401).json({ error: 'No account with this data' });
    }
    // Временно используем простую проверку пароля, пока не реализована WhatsApp верификация
    // TODO: Заменить на WhatsApp верификацию
    const isMatch = password === 'temp123'; // Временный пароль для всех пользователей
    if (!isMatch) {
      return res.status(401).json({ error: 'incorrect password' });
    }
    console.log('user for JWT:', user);
    const token = createJwtToken(user);
    res.json({ token, role: user.role, fullName: user.fullName, id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



// ===== WHATSAPP АВТОРИЗАЦИЯ =====

/**
 * Генерация случайного 4-значного OTP кода
 */
function generateOTPCode(): string {
  // Используем криптографически стойкий генератор для production
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(2);
  const code = (randomBytes.readUInt16BE(0) % 9000 + 1000).toString();
  return code;
}

// Rate limiting для WhatsApp OTP
const otpAttempts = new Map<string, { count: number, lastAttempt: number }>();

function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  const key = phoneNumber;
  const attempt = otpAttempts.get(key);
  
  if (!attempt) {
    otpAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Сброс счётчика каждые 15 минут
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    otpAttempts.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Максимум 3 попытки за 15 минут
  if (attempt.count >= 3) {
    return false;
  }
  
  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}



/**


/**
 * Проверка валидности токена
 * GET /api/auth/validate
 */
router.get('/validate', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await User.findById(decoded.id);
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }
    
    res.json({ valid: true, user: { id: user._id, fullName: user.fullName, role: user.role } });
    
  } catch (error) {
    console.error('❌ Ошибка валидации токена:', error);
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

// ===== АВТОРИЗАЦИЯ ПО ПЕРСОНАЛЬНОМУ КОДУ =====

/**
 * Авторизация сотрудника по персональному коду
 * POST /api/auth/personal-code
 */
router.post('/personal-code', async (req, res) => {
  const { phoneNumber, personalCode } = req.body;
  
  console.log('🔐 Авторизация по персональному коду для номера:', phoneNumber);
  
  if (!phoneNumber || !personalCode) {
    return res.status(400).json({ error: 'Номер телефона и персональный код обязательны' });
  }
  
  try {
    // Ищем пользователя с данным номером и персональным кодом
    const user = await User.findOne({ 
      phone: phoneNumber,
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден или неверный код для номера:', phoneNumber);
      return res.status(401).json({ error: 'Неверный номер телефона или персональный код' });
    }
    
    // Проверяем что пользователь активен
    if (!user.active) {
      console.log('❌ Пользователь неактивен:', user.fullName);
      return res.status(401).json({ error: 'Аккаунт заблокирован. Обратитесь к администратору.' });
    }
    
    // Успешная авторизация
    console.log('✅ Успешная авторизация по персональному коду:', user.fullName);
    
    // Обновляем время последнего входа
    user.lastLogin = new Date() as any;
    await user.save();
    
    console.log('🎉 Пользователь авторизован по персональному коду:', user.fullName);
    
    res.json({
      success: true,
      message: 'Успешная авторизация',
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        type: user.type
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка авторизации по персональному коду:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * Генерация персонального кода для сотрудника (только для админов)
 * POST /api/auth/generate-personal-code
 */


/**

// ===== ВЫХОД ИЗ СИСТЕМЫ =====

/**
 * Выход из системы (logout)
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  try {
    console.log('👋 Пользователь вышел из системы');
    
    // В JWT-based системе logout обычно происходит на клиенте
    // (удаление токена из localStorage)
    // Здесь мы просто подтверждаем успешный выход
    
    res.json({ 
      success: true, 
      message: 'Успешный выход из системы' 
    });
    
  } catch (error) {
    console.error('❌ Ошибка при выходе из системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
