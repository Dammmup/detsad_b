import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';
import { comparePassword } from '../utils/hash';

const router = express.Router();

// Универсальная функция создания JWT-токена для пользователя
function createJwtToken(user: any) {
  return jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      access: user.access,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
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
  return Math.floor(1000 + Math.random() * 9000).toString();
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
        role: phoneNumber.includes('777') ? 'admin' : 'teacher', // 777 в номере = админ
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
    
    // В реальном приложении здесь будет интеграция с WhatsApp Business API
    // Пока что просто логируем код для разработки
    console.log(`📲 [MOCK] Отправка WhatsApp сообщения на ${phoneNumber}:`);
    console.log(`   Ваш код для входа в Детсад CRM: ${otpCode}`);
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

export default router;
