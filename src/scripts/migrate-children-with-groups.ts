import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import XLSX from 'xlsx';
import User from '../entities/users/model';
import Child from '../entities/children/model';
import Group from '../entities/groups/model';
import { randomBytes } from 'crypto';
import { hashPassword } from '../utils/hash';

// Загружаем переменные окружения
dotenv.config();

// Подключение к базе данных
const connectDB = async () => {
  try {
    // Используем MONGO_URI из .env файла
    const dbUri = process.env.MONGO_URI;
    if (!dbUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
 } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Генерация случайного номера телефона
const generateRandomPhone = (): string => {
  const digits = '7012345678';
 let phone = '7';
  for (let i = 0; i < 9; i++) {
    phone += digits[Math.floor(Math.random() * digits.length)];
  }
  return phone;
};

// Генерация случайного пароля
const generateRandomPassword = (): string => {
 return randomBytes(6).toString('hex');
};

// Функция для миграции данных из Excel с присвоением ролей и групп
const migrateUsersWithRoles = async () => {
  try {
    console.log('Начинаем миграцию пользователей из Excel с присвоением ролей и групп...');

    // Читаем Excel файл
    const workbook = XLSX.readFile('../react-material-admin/Пользователи (1).xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Преобразуем в JSON, пропуская заголовки таблицы
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: [
        'Сотрудники', 'Имя', 'Фамилия', 'Отчество', 'Роль доступа', 'Локация',
        'Отдел', 'Должность', 'Email', 'Номер телефона', 'Имеет аккаунт',
        'Пол', 'Язык', 'Дата создания', 'Дата начала работы',
        'Дата окончания контракта', 'Дата рождения', 'Удостоверение личности',
        'Номер налогоплательщика', 'Номер страховки', 'Статус занятости',
        'Обязанности', 'Место рождения', 'Семейное положение', 'Религия',
        'Группа крови', 'Количество детей', 'ФИО контакта', 'Взаимоотношения',
        'Номер телефона_2', 'Адрес', 'Город', 'Область', 'Регион',
        'Почтовый индекс', 'Адрес_2', 'Город_2', 'Область_2', 'Регион_2',
        'Почтовый индекс_2', 'Степень образования', 'Учебное заведение',
        'Специальность', 'Год выпуска', 'Средний бал', 'Полное имя',
        'Псевдоним', 'Местное имя', 'Гражданство', 'Дата вступления в брак',
        'Пенсионный возраст', 'Дата выхода на пенсию', 'Этническое происхождение',
        'Номер контракта', 'Номер мед. страхования', 'Номер гос. сбережений',
        'Счет гос. сбережений', 'Номер дома', 'Улица', 'Здание', 'Номер дома_2',
        'Улица_2', 'Здание_2', 'Гражданский статус', 'Вес', 'Рост',
        'Должность при приеме на работу', 'Отдел при приеме на работу',
        'Должность при переводе', 'Отдел при переводе', 'Дата приема на работу',
        'POS-номер', 'Квалификация', 'Подробности', 'Дата посещения',
        'Примечания', 'Дата посещения_2', 'Примечания_2', 'Дата посещения_3',
        'Примечания_3', 'Дата получения', 'Примечания_4', 'Telegram',
        'Instagram', 'WhatsApp', 'ID', 'Location ID', 'Department ID', 'Position ID'
      ]
    });
    
    // Пропускаем первые две строки, которые содержат заголовки таблицы
    const dataRows = jsonData.filter((row: any, index: number) => index >= 2 && row['Имя'] || row['Фамилия']);
    
    console.log(`Найдено ${jsonData.length} записей в Excel файле`);

    let processedCount = 0;
    let skippedCount = 0;
    let childrenCount = 0;
    let usersCount = 0;

    // Определяем соответствие должностей и ролей
    const positionToRoleMap: { [key: string]: string } = {
      'Бухгалтер': 'staff', // или 'admin' если является администратором
      'Программист': 'staff', // или 'admin' если является администратором
      'Воспитатель': 'teacher',
      'Няня': 'assistant',
      'Завхоз': 'staff', // используем staff, так как security не совсем подходит
      'Повар': 'cook',
      'Хореограф': 'music_teacher',
      'Администратор': 'admin'
    };

    // Создаем или находим группы для детей
    const groupMap = new Map<string, mongoose.Types.ObjectId>();

    for (const row of dataRows) {
      // Получаем данные из колонок
      const firstName = row['Имя'] || '';
      const lastName = row['Фамилия'] || '';
      const middleName = row['Отчество'] || '';
      const position = row['Должность'] || '';
      const phone = row['Номер телефона'] || '';
      const department = row['Отдел'] || '';
      const birthday = row['Дата рождения'] || undefined;
      const notes = row['Примечания'] || '';

      // Объединяем имя, фамилию и отчество в fullname
      let fullName = firstName.trim();
      if (lastName.trim()) fullName += ' ' + lastName.trim();
      if (middleName.trim()) fullName += ' ' + middleName.trim();
      
      // Пропускаем записи с пустым именем
      if (!fullName.trim()) {
        console.log('Пропускаем запись без имени');
        continue;
      }

      // Проверяем, существует ли уже пользователь с таким именем
      const existingUser = await User.findOne({ fullName: fullName.trim() });
      const existingChild = await Child.findOne({ fullName: fullName.trim() });

      if (existingUser || existingChild) {
        console.log(`Запись с именем ${fullName} уже существует, пропускаем`);
        skippedCount++;
        continue;
      }

      // Если должность "Ребенок", добавляем в коллекцию детей
      if (position === 'Ребенок') {
        // Если у ребенка есть отдел (группа), создаем или находим его
        let groupId: mongoose.Types.ObjectId | undefined;
        
        if (department) {
          // Проверяем, есть ли уже группа с таким названием в карте
          if (!groupMap.has(department)) {
            // Проверяем, существует ли уже группа с таким названием в базе данных
            let group = await Group.findOne({ name: department });
            
            // Если группа не существует, создаем ее
            if (!group) {
              group = new Group({
                name: department,
                isActive: true
              });
              await group.save();
              console.log(`Создана группа: ${department}`);
            }
            
            groupId = group._id as mongoose.Types.ObjectId;
            groupMap.set(department, groupId);
          } else {
            groupId = groupMap.get(department);
          }
        }

        const childData = {
          fullName: fullName.trim(),
          birthday: birthday && new Date(birthday).toString() !== 'Invalid Date' ? new Date(birthday) : undefined,
          parentPhone: phone || undefined, // Номер телефона сохраняем как номер родителя
          notes: notes || undefined,
          groupId: groupId // Присваиваем группу ребенку
        };

        const newChild = new Child(childData);
        await newChild.save();
        
        console.log(`Создан ребенок: ${fullName} в группе: ${department || 'не указана'}`);
        childrenCount++;
      } else {
        // Определяем роль на основе должности
        let role = 'staff'; // по умолчанию роль staff
        if (positionToRoleMap[position]) {
          role = positionToRoleMap[position];
        }

        // В противном случае добавляем в коллекцию пользователей
        const rawPassword = generateRandomPassword();
        const userData = {
          fullName: fullName.trim(),
          phone: phone || generateRandomPhone(),
          password: rawPassword, // Сохраняем пароль в поле password
          initialPassword: rawPassword, // Сохраняем пароль в открытом виде для отображения на фронте
          passwordHash: await hashPassword(rawPassword), // Хэшируем пароль для аутентификации
          // uniqNumber больше не используется
          notes: notes || undefined,
          birthday: birthday && new Date(birthday).toString() !== 'Invalid Date' ? new Date(birthday) : undefined,
          role: role
          // Не указываем поля, которые дублируются в Payroll:
          // salary, shiftRate, salaryType, penaltyType, penaltyAmount
        };

        const newUser = new User(userData);
        await newUser.save();
        
        console.log(`Создан пользователь: ${fullName} с ролью: ${role}`);
        usersCount++;
      }

      processedCount++;
    }

    console.log(`Миграция завершена!`);
    console.log(`Обработано: ${processedCount}`);
    console.log(`Добавлено пользователей: ${usersCount}`);
    console.log(`Добавлено детей: ${childrenCount}`);
    console.log(`Пропущено (дубликаты): ${skippedCount}`);
  } catch (error) {
    console.error('Ошибка при миграции пользователей из Excel:', error);
    throw error;
 }
};

// Функция для создания администратора
const createAdminUser = async () => {
  try {
    console.log('Создаем пользователя с ролью администратора...');

    // Проверяем, существует ли уже администратор
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Администратор уже существует');
      return;
    }

    const rawPassword = generateRandomPassword();
    const adminUser = new User({
      fullName: 'System Administrator',
      phone: '777777',
      password: rawPassword,
      initialPassword: rawPassword, // Пароль в открытом виде для отображения на фронте
      passwordHash: await hashPassword(rawPassword), // Хэшируем пароль для аутентификации
      role: 'admin',
      notes: 'System administrator account'
    });

    await adminUser.save();
    console.log('Создан пользователь с ролью администратора');
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await migrateUsersWithRoles();
  await createAdminUser();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

// Запуск скрипта
runScript();