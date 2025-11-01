# Настройка подключения к нескольким базам данных

## Обзор

Проект настроен для использования нескольких баз данных MongoDB для лучшей организации коллекций:

- **Основная база данных (`test`)**: Содержит основные сущности системы (пользователи, группы, дети, посещаемость и т.д.)
- **Медицинская база данных (`medician_journals`)**: Содержит все медицинские журналы и карточки (соматический журнал, журнал Манту, глисты, инфекционные заболевания и т.д.)
- **Пищевая база данных (`food_journals`)**: Содержит журналы, связанные с питанием и пищеблоком (органолептический журнал, журнал склада продуктов, сертификаты продукции и т.д.)

## Конфигурация

Конфигурация подключения находится в файле `src/config/database.ts`:

```typescript
const DATABASE_URIS = {
  default: process.env.MONGO_URI || 'mongodb://localhost:27017/test',
  medical: process.env.MEDICAL_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medician_journals',
  food: process.env.FOOD_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/food_journals',
};
```

## Переменные окружения

Для настройки подключения используйте следующие переменные в `.env`:

```env
# Основное подключение к MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority&appName=YourApp

# Подключение к базе данных медицинских журналов (опционально)
MEDICAL_MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/medician_journals?retryWrites=true&w=majority&appName=YourApp

# Подключение к базе данных журналов по питанию (опционально)
FOOD_MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/food_journals?retryWrites=true&w=majority&appName=YourApp
```

Если `MEDICAL_MONGO_URI` или `FOOD_MONGO_URI` не указаны, система будет использовать `MONGO_URI` для подключения к соответствующей базе данных.

## Модели и их распределение

### Медицинские журналы (medician_journals)
- `medicalJournals/model.ts` - Общий медицинский журнал
- `somaticJournal/model.ts` - Соматический журнал
- `mantouxJournal/model.ts` - Журнал Манту
- `helminthJournal/model.ts` - Журнал на глисты
- `infectiousDiseasesJournal/model.ts` - Журнал инфекционных заболеваний
- `tubPositiveJournal/model.ts` - Журнал туберкулезных
- `contactInfectionJournal/model.ts` - Журнал контактных инфекций
- `riskGroupChildren/model.ts` - Дети из группы риска

### Журналы по питанию/пищеблоку (food_journals)
- `organolepticJournal/model.ts` - Органолептический журнал
- `foodStaffHealth/model.ts` - Здоровье сотрудников пищеблока
- `foodStockLog/model.ts` - Журнал склада продуктов
- `perishableBrak/model.ts` - Брак скоропортящихся продуктов
- `productCertificates/model.ts` - Сертификаты продукции
- `detergentLog/model.ts` - Журнал моющих средств

### Остальные сущности (test)
- `users/model.ts` - Пользователи
- `children/model.ts` - Дети
- `groups/model.ts` - Группы
- `childAttendance/model.ts` - Посещаемость детей
- `payroll/model.ts` - Зарплаты
- `documents/model.ts` - Документы
- `reports/model.ts` - Отчеты
- И другие основные сущности

## Использование

При создании новых моделей определите, к какой категории она относится, и используйте соответствующее подключение:

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { getConnection } from '../../config/database';

// Для медицинских сущностей:
const medicalConnection = getConnection('medical');
export default medicalConnection.model<IMedicalEntity>('MedicalEntity', schema, 'collection_name');

// Для сущностей, связанных с питанием:
const foodConnection = getConnection('food');
export default foodConnection.model<IFoodEntity>('FoodEntity', schema, 'collection_name');

// Для остальных сущностей:
const defaultConnection = getConnection('default');
export default defaultConnection.model<IOtherEntity>('OtherEntity', schema, 'collection_name');
```

## Создание коллекций

Коллекции создаются автоматически при первом обращении к соответствующей модели после запуска бэкенда. MongoDB автоматически создает коллекцию в соответствующей базе данных при первом выполнении операции CRUD (создание, чтение, обновление, удаление) с использованием модели. Таким образом, вам не нужно вручную создавать коллекции - они создаются по мере необходимости при работе с приложением.

## Архитектура с отложенным созданием моделей

Для решения проблемы, когда модели пытаются подключиться к базе данных до её инициализации, была внедрена архитектура с отложенным созданием моделей:

1. Модели определяются как фабрики, которые создают реальные модели только после подключения к базе данных
2. Все фабрики моделей регистрируются в централизованном реестре
3. При запуске приложения сначала происходит подключение к базам данных, затем создаются все модели
4. Сервисы получают модели из реестра в момент выполнения запроса

Это позволяет избежать ошибок при запуске приложения и гарантирует, что все модели будут использовать правильное подключение к базе данных.

## Использование моделей в сервисах

После обновления архитектуры все сервисы должны использовать зарегистрированные модели следующим образом:

```typescript
import { getModel } from '../../config/modelRegistry';

// В методе сервиса:
async someMethod() {
  // Получаем модель из реестра
  const UserModel = getModel<IUser>('User');
  
  // Используем модель как обычно
  const users = await UserModel.find({});
  return users;
}
```

Это гарантирует, что модель будет создана только после подключения к базе данных и будет использовать правильное подключение к соответствующей базе данных.
```

## Преимущества

1. **Организация**: Логическое разделение коллекций по тематическим базам данных
2. **Масштабируемость**: Возможность масштабировать разные части системы независимо
3. **Производительность**: Потенциальное улучшение производительности за счет распределения нагрузки
4. **Управление**: Упрощенное управление и резервное копирование отдельных частей системы