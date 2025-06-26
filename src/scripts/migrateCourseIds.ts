import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course';
import Lesson from '../models/Lesson';

// Загружаем переменные окружения
dotenv.config();

async function migrateCourseIds() {
  try {
    // Подключаемся к базе данных
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uyghur_connect';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri, {
      dbName: 'uyghur_connect',
    });
    console.log('Connected to MongoDB');

    // Проверяем все коллекции в базе данных
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('Available collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Прямые запросы к коллекциям без Mongoose
      console.log('\nDirect MongoDB queries:');
      try {
        const courseCount = await db.collection('courses').countDocuments();
        console.log(`Direct query - courses collection: ${courseCount} documents`);
        
        const lessonCount = await db.collection('lessons').countDocuments();
        console.log(`Direct query - lessons collection: ${lessonCount} documents`);
        
        // Показать несколько документов из каждой коллекции
        if (courseCount > 0) {
          const sampleCourses = await db.collection('courses').find({}).limit(3).toArray();
          console.log('Sample courses:');
          sampleCourses.forEach(course => {
            console.log(`- ${course._id}: ${course.name} (lessonId: ${course.lessonId || 'N/A'})`);
          });
        }
        
        if (lessonCount > 0) {
          const sampleLessons = await db.collection('lessons').find({}).limit(3).toArray();
          console.log('Sample lessons:');
          sampleLessons.forEach(lesson => {
            console.log(`- ${lesson._id}: ${lesson.title} (course: ${lesson.course || 'N/A'})`);
          });
        }
      } catch (directQueryError) {
        console.log('Error with direct queries:', directQueryError);
      }
    }

    // Получаем все курсы
    const allCourses = await Course.find({});
    console.log(`Found ${allCourses.length} total courses in database`);

    // ID урока, который нужно присвоить всем курсам
    const lessonId = '68445f194c4432f38d13ea48';
    console.log(`\nWill assign lesson ID: ${lessonId} to all courses`);
    
    // Правильно конвертируем строку в ObjectId для поиска
    let existingLesson;
    try {
      existingLesson = await Lesson.findById(new mongoose.Types.ObjectId(lessonId));
    } catch (conversionError) {
      console.log('Error converting lesson ID to ObjectId:', conversionError);
      existingLesson = null;
    }
    
    if (existingLesson) {
      console.log(`Found lesson: ${existingLesson.title}`);
    } else {
      console.log('Lesson not found. Looking for any lessons in database...');
      const anyLessons = await Lesson.find({}).limit(5);
      console.log(`Found ${anyLessons.length} lessons in total:`);
      anyLessons.forEach(lesson => {
        console.log(`- ${lesson._id}: ${lesson.title}`);
      });
      return; // Выходим, если урок не найден
    }

    // Обновляем каждый курс: удаляем старые поля и добавляем lessonId
    for (let i = 0; i < allCourses.length; i++) {
      const course = allCourses[i];
      
      const updateResult = await Course.updateOne(
        { _id: course._id },
        { 
          $set: { lessonId: new mongoose.Types.ObjectId(lessonId) },
          $unset: { language: "", courseId: "" } // Удаляем старые поля
        }
      );
      
      console.log(`Updated course "${course.name}": assigned lessonId and removed old fields`);
    }

    console.log('\n=== Migration completed successfully ===');
    console.log(`✅ ${allCourses.length} courses updated`);
    console.log(`✅ Assigned lessonId: ${lessonId}`);
    console.log('✅ Removed fields: language, courseId');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Запускаем миграцию
migrateCourseIds();
