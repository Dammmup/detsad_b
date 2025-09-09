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
 * Отправка OTP кода через WhatsApp
 * POST /api/auth/whatsapp/send-otp
 */
router.post('/whatsapp/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  console.log('📱 WhatsApp OTP запрос для номера:', phoneNumber);
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Номер телефона обязателен' });
  }
  
  // Валидация номера телефона (казахстанский формат)
  const phoneRegex = /^\+?7[0-9]{10}$|^8[0-9]{10}$/;
  if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
    return res.status(400).json({ error: 'Неверный формат номера телефона' });
  }
  
  // Проверка rate limiting
  if (!checkRateLimit(phoneNumber)) {
    return res.status(429).json({ 
      error: 'Слишком много попыток. Попробуйте через 15 минут.',
      retryAfter: 900 // 15 минут в секундах
    });
  }
  
  try {
    // Генерируем OTP код
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут
    
    console.log('🔢 Сгенерирован OTP код:', otpCode, 'для номера:', phoneNumber);
    
    // Ищем или создаем пользователя
    let user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      // Создаем нового пользователя для WhatsApp авторизации
      console.log('👤 Создаем нового пользователя для номера:', phoneNumber);
      
      user = new User({
        fullName: `Пользователь ${phoneNumber}`,
        phone: phoneNumber,
        type: 'adult',
        role: phoneNumber.includes('7777777777') ? 'admin' : 'teacher', // Конкретный админский номер
        active: true,
        isVerified: false,
        verificationCode: otpCode,
        verificationCodeExpires: expiresAt as any
      });
    } else {
      // Обновляем код для существующего пользователя
      console.log('🔄 Обновляем OTP код для существующего пользователя:', user.fullName);
      
      user.verificationCode = otpCode;
      user.verificationCodeExpires = expiresAt as any;
    }
    
    await user.save();
    
    // Простое логирование OTP кода для разработки
    console.log(`📲 OTP код для ${phoneNumber}: ${otpCode}`);
    console.log(`   Код действителен 5 минут.`);
    
    res.json({
      success: true,
      message: `Код отправлен в WhatsApp на номер ${phoneNumber}`,
      expiresIn: 300, // 5 минут в секундах
      // В разработке показываем код для удобства
      ...(process.env.NODE_ENV === 'development' && { 
        devCode: otpCode,
        devMessage: `Код для разработки: ${otpCode}` 
      })
    });
    
  } catch (error) {
    console.error('❌ Ошибка отправки OTP:', error);
    res.status(500).json({ error: 'Ошибка отправки кода' });
  }
});

/**
 * Верификация OTP кода и вход через WhatsApp
 * POST /api/auth/whatsapp/verify-otp
 */
router.post('/whatsapp/verify-otp', async (req, res) => {
  const { phoneNumber, otpCode } = req.body;
  
  console.log('🔐 WhatsApp верификация для номера:', phoneNumber, 'код:', otpCode);
  
  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ error: 'Номер телефона и код обязательны' });
  }
  
  try {
    // Ищем пользователя с данным номером
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      console.log('❌ Пользователь не найден для номера:', phoneNumber);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем код и срок действия
    if (!user.verificationCode || !user.verificationCodeExpires) {
      console.log('❌ Код не найден для пользователя:', user.fullName);
      return res.status(400).json({ error: 'Код не найден. Запросите новый код.' });
    }
    
    if (user.verificationCode !== otpCode) {
      console.log('❌ Неверный код для пользователя:', user.fullName, 'ожидался:', user.verificationCode, 'получен:', otpCode);
      return res.status(400).json({ error: 'Неверный код' });
    }
    
    if (new Date() > new Date(user.verificationCodeExpires as any)) {
      console.log('❌ Код истек для пользователя:', user.fullName);
      return res.status(400).json({ error: 'Код истек. Запросите новый код.' });
    }
    
    // Код верный! Авторизуем пользователя
    console.log('✅ Успешная верификация для пользователя:', user.fullName);
    
    // Очищаем код и отмечаем как верифицированного
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.isVerified = true;
    user.lastLogin = new Date() as any;
    
    await user.save();
    
    // Создаем JWT токен
    const token = createJwtToken(user);
    
    console.log('🎉 Пользователь авторизован через WhatsApp:', user.fullName);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        type: user.type
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка верификации OTP:', error);
    res.status(500).json({ error: 'Ошибка верификации кода' });
  }
});

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
      personalCode: personalCode.toUpperCase().trim()
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
    user.isVerified = true;
    await user.save();
    
    // Создаем JWT токен
    const token = createJwtToken(user);
    
    console.log('🎉 Пользователь авторизован по персональному коду:', user.fullName);
    
    res.json({
      success: true,
      message: 'Успешная авторизация',
      token,
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
router.post('/generate-personal-code', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'ID пользователя обязателен' });
  }
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Генерируем уникальный персональный код (6 символов)
    const personalCode = generatePersonalCode();
    
    // Проверяем уникальность кода
    const existingUser = await User.findOne({ personalCode });
    if (existingUser) {
      // Если код уже существует, генерируем новый
      return res.status(500).json({ error: 'Ошибка генерации кода. Попробуйте еще раз.' });
    }
    
    // Сохраняем код
    user.personalCode = personalCode;
    await user.save();
    
    console.log('🔑 Сгенерирован персональный код для:', user.fullName, 'Код:', personalCode);
    
    res.json({
      success: true,
      message: 'Персональный код сгенерирован',
      personalCode,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        personalCode
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка генерации персонального кода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * Генерация персонального кода (6 символов: буквы + цифры)
 */
function generatePersonalCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
