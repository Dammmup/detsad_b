# Новая архитектура сущностей

## Описание

Проект переработан с использованием архитектуры, где каждая сущность содержит свои компоненты в отдельной папке:

- `model.ts` - модель Mongoose для работы с базой данных
- `service.ts` - бизнес-логика и операции сущности
- `controller.ts` - обработчики Express-роутов
- `route.ts` - определения маршрутов (если необходимы)

## Структура папок

```
backend/src/entities/
├── children/
│   ├── model.ts
│   ├── service.ts
│   ├── controller.ts
│   └── route.ts
├── groups/
│   ├── model.ts
│   ├── service.ts
│   ├── controller.ts
│   └── route.ts
├── users/
│   ├── model.ts
│   ├── service.ts
│   ├── controller.ts
│   └── route.ts
└── ... (и так для каждой сущности)
```

## Существующие сущности

На данный момент реализованы:

1. **children** - управление детьми
2. **groups** - управление группами
3. **users** - управление пользователями
4. **auth** - аутентификация и авторизация
5. **staffAttendanceTracking** - учет посещаемости и времени сотрудников (объединенная сущность, включающая функции timeTracking и staffTimeTracking)
6. **childAttendance** - учет посещаемости детей
7. **documents** - документооборот
8. **payroll** - расчет заработной платы
9. **reports** - отчеты
10. **medicalJournals** - медицинские журналы
11. **menuItems** - элементы меню
12. **healthPassport** - медицинские карточки
13. **taskList** - списки задач
14. **somaticJournal** - соматический журнал
15. **mantouxJournal** - журнал Манту
16. **helminthJournal** - журнал на глисты
17. **tubPositiveJournal** - журнал туберкулезных
18. **infectiousDiseasesJournal** - журнал инфекционных заболеваний
19. **contactInfectionJournal** - журнал контактных инфекций
20. **riskGroupChildren** - дети из группы риска
21. **organolepticJournal** - органолептический журнал
22. **perishableBrak** - брак скоропортящихся продуктов
23. **productCertificates** - сертификаты продукции
24. **detergentLog** - журнал моющих средств
25. **foodStockLog** - журнал склада продуктов
26. **foodStaffHealth** - здоровье сотрудников пищеблока
27. **staffShifts** - смены сотрудников
28. **schedules** - расписания
29. **settings** - настройки системы

## Старые сущности, объединенные в staffAttendanceTracking

Ранее существовали отдельные сущности:
1. **timeTracking** - учет времени сотрудников (с геолокацией и фотографиями)
2. **staffTimeTracking** - учет времени сотрудников (с штрафами и бонусами)

Эти сущности были объединены в одну универсальную сущность **staffAttendanceTracking**, которая включает в себя всю функциональность обеих сущностей:
- функции clock-in/out с геолокацией и фотографиями
- функции учета перерывов
- функции расчета рабочего времени
- функции штрафов и бонусов
- функции статистики и отчетов
- функции утверждения и модерации

Ниже приведены шаблоны для создания остальных сущностей:

### 1. auth (аутентификация)
Файл: `backend/src/entities/auth/route.ts`
```typescript
import express from 'express';
import { login, register, logout, refreshToken } from './controller';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

export default router;
```

### 2. timeTracking (учет времени)
Файл: `backend/src/entities/timeTracking/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeEntry extends Document {
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number,
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
 notes: String,
}, { timestamps: true });

export default mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema, 'time_entries');
```

### 3. payroll (зарплаты)
Файл: `backend/src/entities/payroll/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  userId: mongoose.Types.ObjectId;
  period: string; // например, '2025-01'
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
 status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  createdAt: Date;
 updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
  paymentDate: Date,
}, { timestamps: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema, 'payrolls');
```

### 4. documents (документы)
Файл: `backend/src/entities/documents/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  description?: string;
 fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  owner: mongoose.Types.ObjectId;
  category: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
 updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  description: String,
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

export default mongoose.model<IDocument>('Document', DocumentSchema, 'documents');
```

## Принципы архитектуры

1. **Разделение ответственности**: каждая сущность отвечает за свои данные и логику
2. **Модульность**: легко добавлять, изменять или удалять сущности
3. **Тестируемость**: каждая часть может быть протестирована отдельно
4. **Поддерживаемость**: понятная структура облегчает сопровождение

## Обновление основного приложения

В файле `backend/src/app.ts` все импорты роутов изменены на новые:

```typescript
import childrenRoutes from './entities/children/route';
import groupRoutes from './entities/groups/route';
import userRoutes from './entities/users/route';
// и так далее для всех сущностей
```

## Завершение переноса

Для завершения переноса всех сущностей, создайте соответствующие файлы в папках `backend/src/entities/` используя предоставленные шаблоны.