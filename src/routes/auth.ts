import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';
import bcrypt from 'bcryptjs';

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
    // Проверяем пароль с использованием bcrypt
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'incorrect password' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
