import express from 'express';
import User from '../models/Users';
import bcrypt from 'bcryptjs';
const router = express.Router();

// Проверка уникальности email и username (логина)
router.post('/check-duplicate', async (req, res) => {
  const { username, email } = req.body;
  // username = login, email = email (если будет поле email)
  try {
    const userByUsername = await User.findOne({ username });
   const userByEmail = await User.findOne({ email });
    if (userByUsername || userByEmail) {
      return res.status(409).json({ error: 'Пользователь с такими данными уже существует' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить всех пользователей, кроме админов (без passwordHash)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }, '-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация/создание пользователя


router.post('/', async (req, res) => {
  try {
    const {
      login,
      password,
      username,
      firstName,
      lastName,
      phone,
      country,
      language,
      photo,
      role,
      gender,
      telegram,
      whatsapp,
      email,
      birthday,
      notes,
      active,
      blocked,
      emailVerified
    } = req.body;
    // Логируем тело запроса для отладки
    console.log('POST /users req.body:', req.body);
    // Валидация
    function isFilled(val: any) {
      return typeof val === 'string' ? val.trim().length > 0 : !!val;
    }
    if (![login, password, username, firstName, lastName, phone, country, language, email].every(isFilled)) {
      return res.status(400).json({ error: 'Обязательные поля не заполнены' });
    }
    // Хэширование пароля
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      login, // сохраняем логин
      username,
      passwordHash,
      firstName,
      lastName,
      phone,
      country,
      language,
      photo,
      role: role || 'student',
      active: active !== undefined ? active : true,
      blocked: blocked !== undefined ? blocked : false,
      emailVerified: emailVerified !== undefined ? emailVerified : false,
      lastLogin: new Date(),
      gender: gender || 'male',
      telegram,
      whatsapp,
      email,
      birthday,
      notes,
      createdAt: new Date(),
    });
    await user.save();
    // Исключаем passwordHash из ответа
    const userObj = user.toObject();
    delete (userObj as any).passwordHash;
    res.status(201).json(userObj);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Пользователь с такими данными уже существует' });
    }
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

// Получить пользователя по id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id format' });
  }
});

export default router;
