import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Document from '../models/Document';
import User from '../models/Users';

dotenv.config();

const populateDocuments = async () => {
  try {
    // Подключение к базе данных
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kindergarten';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключено к MongoDB');

    // Проверка наличия пользователей
    const users = await User.find({});
    if (users.length === 0) {
      console.log('❌ Нет пользователей в базе данных. Создайте пользователя перед запуском этого скрипта.');
      process.exit(1);
    }

    // Выбор первого пользователя как загрузчика документов
    const uploader = users[0]._id;

    // Примеры документов по стандартам РК
    const sampleDocuments = [
      {
        title: 'Трудовой договор Иванова И.И.',
        description: 'Трудовой договор с воспитателем Ивановой И.И.',
        type: 'contract',
        category: 'staff',
        fileName: 'employment_contract_ivanov.pdf',
        fileSize: 102400,
        filePath: path.join(__dirname, '../uploads/documents/employment_contract_ivanov.pdf'),
        uploadDate: new Date('2025-09-01'),
        uploader: uploader,
        status: 'active',
        tags: ['договор', 'сотрудник', 'труд'],
        version: '1.0'
      },
      {
        title: 'Медицинская справка Петрова П.П.',
        description: 'Медицинская справка ребенка Петрова П.П.',
        type: 'certificate',
        category: 'children',
        fileName: 'medical_certificate_petrov.pdf',
        fileSize: 76800,
        filePath: path.join(__dirname, '../uploads/documents/medical_certificate_petrov.pdf'),
        uploadDate: new Date('2025-09-10'),
        uploader: uploader,
        status: 'active',
        tags: ['медицинский', 'ребенок', 'справка'],
        version: '1.0'
      },
      {
        title: 'Отчет по зарплатам за сентябрь 2025',
        description: 'Финансовый отчет по зарплатам сотрудников за сентябрь 2025 года',
        type: 'report',
        category: 'financial',
        fileName: 'salary_report_sept_2025.xlsx',
        fileSize: 51200,
        filePath: path.join(__dirname, '../uploads/documents/salary_report_sept_2025.xlsx'),
        uploadDate: new Date('2025-09-15'),
        uploader: uploader,
        status: 'active',
        tags: ['зарплата', 'отчет', 'финансы'],
        version: '1.0'
      },
      {
        title: 'Политика конфиденциальности',
        description: 'Политика конфиденциальности детского сада',
        type: 'policy',
        category: 'administrative',
        fileName: 'privacy_policy.docx',
        fileSize: 38400,
        filePath: path.join(__dirname, '../uploads/documents/privacy_policy.docx'),
        uploadDate: new Date('2025-07-15'),
        uploader: uploader,
        status: 'active',
        tags: ['политика', 'конфиденциальность', 'администрация'],
        version: '2.1'
      }
    ];

    // Удаление существующих документов
    await Document.deleteMany({});
    console.log('✅ Существующие документы удалены');

    // Добавление примеров документов
    for (const docData of sampleDocuments) {
      // Корректируем путь для хранения в базе данных (относительный путь)
      const dbDocData = {
        ...docData,
        filePath: docData.filePath.replace(path.join(__dirname, '../'), '')
      };
      
      const doc = new Document(dbDocData);
      await doc.save();
      console.log(`✅ Добавлен документ: ${doc.title}`);
    }

    console.log('✅ Все документы успешно добавлены');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при добавлении документов:', error);
    process.exit(1);
  }
};

populateDocuments();