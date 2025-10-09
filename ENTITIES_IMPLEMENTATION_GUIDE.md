# Руководство по реализации сущностей

## Обзор

Этот файл описывает структуру и шаблоны для оставшихся сущностей, которые должны быть реализованы в архитектуре с разделенными сущностями.

## Структура сущности

Каждая сущность должна содержать следующие файлы:

```
backend/src/entities/{entityName}/
├── model.ts      # Модель Mongoose
├── service.ts    # Бизнес-логика
├── controller.ts # Обработчики запросов
└── route.ts      # Маршруты (если необходимы)
```

## Оставшиеся сущности

Ниже приведены шаблоны для оставшихся сущностей:

### 1. payroll (зарплаты)

**Файл:** `backend/src/entities/payroll/model.ts`
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

### 2. settings (настройки)

**Файл:** `backend/src/entities/settings/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  type: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
  type: { type: String, required: true },
  description: String,
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema, 'settings');
```

### 3. documents (документы)

**Файл:** `backend/src/entities/documents/model.ts`
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

### 4. reports (отчеты)

**Файл:** `backend/src/entities/reports/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  title: string;
  description?: string;
 type: string;
 data: any;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  filters: any;
  format: 'pdf' | 'excel' | 'csv';
  status: 'draft' | 'generated' | 'sent';
  recipients?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  title: { type: String, required: true },
  description: String,
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  filters: { type: Schema.Types.Mixed },
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  status: { type: String, enum: ['draft', 'generated', 'sent'], default: 'draft' },
  recipients: [String],
}, { timestamps: true });

export default mongoose.model<IReport>('Report', ReportSchema, 'reports');
```

### 5. medicalJournals (медицинские журналы)

**Файл:** `backend/src/entities/medicalJournals/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalJournal extends Document {
  childId: mongoose.Types.ObjectId;
  type: string; // 'somatic', 'mantoux', 'helminth', 'infectious', 'tubPositive'
  date: Date;
  result: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const MedicalJournalSchema = new Schema<IMedicalJournal>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  result: { type: String, required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
 attachments: [String],
  status: { type: String, enum: ['pending', 'completed', 'reviewed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IMedicalJournal>('MedicalJournal', MedicalJournalSchema, 'medical_journals');
```

### 6. menuItems (элементы меню)

**Файл:** `backend/src/entities/menuItems/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description?: string;
  category: string; // 'breakfast', 'lunch', 'dinner', 'snack'
  ingredients: string[];
  nutritionalInfo: {
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
  };
  allergens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  ingredients: [String],
  nutritionalInfo: {
    calories: Number,
    proteins: Number,
    fats: Number,
    carbs: Number
  },
  allergens: [String],
}, { timestamps: true });

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema, 'menu_items');
```

### 7. healthPassport (медицинский паспорт)

**Файл:** `backend/src/entities/healthPassport/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthPassport extends Document {
  childId: mongoose.Types.ObjectId;
  birthDate: Date;
 birthPlace: string;
  bloodType: string;
  rhesus: string;
  chronicDiseases: string[];
  allergies: string[];
  vaccinationHistory: Array<{
    vaccine: string;
    date: Date;
    nextDate?: Date;
  }>;
  doctorExaminations: Array<{
    doctor: string;
    date: Date;
    result: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HealthPassportSchema = new Schema<IHealthPassport>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  birthDate: { type: Date, required: true },
  birthPlace: String,
  bloodType: String,
  rhesus: String,
  chronicDiseases: [String],
  allergies: [String],
  vaccinationHistory: [{
    vaccine: String,
    date: Date,
    nextDate: Date
  }],
  doctorExaminations: [{
    doctor: String,
    date: Date,
    result: String
  }],
  notes: String,
}, { timestamps: true });

export default mongoose.model<IHealthPassport>('HealthPassport', HealthPassportSchema, 'health_passports');
```

### 8. taskList (список задач)

**Файл:** `backend/src/entities/taskList/model.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
 assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: String,
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  category: String,
  attachments: [String],
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema, 'tasks');
```

## Шаблоны для остальных сущностей

Остальные сущности (somaticJournal, mantouxJournal, helminthJournal, tubPositiveJournal, infectiousDiseasesJournal, contactInfectionJournal, riskGroupChildren, organolepticJournal, perishableBrak, productCertificates, detergentLog, foodStockLog, foodStaffHealth) будут следовать аналогичной структуре с учетом их специфических полей и требований.

## Обновление app.ts

После реализации всех сущностей, файл `backend/src/app.ts` должен быть обновлен для использования новых маршрутов:

```typescript
// Заменить старые импорты на новые
import childrenRoutes from './entities/children/route';
import groupRoutes from './entities/groups/route';
import userRoutes from './entities/users/route';
// и так далее для всех сущностей
```

## Заключение

Это руководство предоставляет шаблоны и структуру для завершения реализации всех сущностей в архитектуре с разделенными сущностями. Каждая сущность должна содержать модель, сервис, контроллер и роут (если необходим).