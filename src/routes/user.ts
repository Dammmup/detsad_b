import express from 'express';
import AdminUser from '../models/AdminUser';
import bcrypt from 'bcryptjs';
const router = express.Router();

// Проверка уникальности email и username (логина)
router.post('/check-duplicate', async (req, res) => {
  const { username, email } = req.body;
  // username = login, email = email (если будет поле email)
  try {
    const userByUsername = await AdminUser.findOne({ username });
   const userByEmail = await AdminUser.findOne({ email });
    if (userByUsername || userByEmail) {
      return res.status(409).json({ error: 'Пользователь с такими данными уже существует' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация/создание пользователя


router.post('/', async (req, res) => {
  try {
    const {
      login, // явное поле логина
      password, // явное поле пароля
      username, firstName, lastName, phone, country, language, photo, role, active, blocked, emailVerified,
      gender, telegram, whatsapp, vk, email, birthday, notes, access, coursesCompleted
    } = req.body;
    // Валидация
    if (!login || !password || !username || !firstName || !lastName || !phone || !country || !language || !email) {
      return res.status(400).json({ error: 'Обязательные поля не заполнены' });
    }
    // Хэширование пароля
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new AdminUser({
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
      vk,
      email,
      birthday,
      notes,
      access: access || 'none',
      coursesCompleted: coursesCompleted || 0,
      createdAt: new Date(),
    });
    await user.save();
    // Исключаем passwordHash из ответа
    const userObj = user.toObject();
    if (userObj.passwordHash) delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Пользователь с такими данными уже существует' });
    }
    res.status(500).json({ error: err.message || 'Ошибка сервера' });
  }
});

export default router;
