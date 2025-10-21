// ...existing code...
import helminthJournalRoutes from './entities/helminthJournal/route';
import tubPositiveJournalRoutes from './entities/tubPositiveJournal/route';
import infectiousDiseasesJournalRoutes from './entities/infectiousDiseasesJournal/route';
import contactInfectionJournalRoutes from './entities/contactInfectionJournal/route';
import riskGroupChildrenRoutes from './entities/riskGroupChildren/route';
import rentRoutes from './entities/rent/route'; // Добавляем маршрут для аренды
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import organolepticJournalRoutes from './entities/organolepticJournal/route';
import perishableBrakRoutes from './entities/perishableBrak/route';
import productCertificateRoutes from './entities/productCertificates/route';
import detergentLogRoutes from './entities/detergentLog/route';
import foodStockLogRoutes from './entities/foodStockLog/route';
import foodStaffHealthRoutes from './entities/foodStaffHealth/route';
import authRoutes from './entities/auth/route';
import userRoutes from './entities/users/route';
import groupRoutes from './entities/groups/route';
import staffShiftRoutes from './entities/staffShifts/route';
import childAttendanceRoutes from './entities/childAttendance/route';
import payrollRoutes from './entities/payroll/route';
import settingsRoutes from './entities/settings/route';
import documentsRoutes from './entities/documents/route';
import reportsRoutes from './entities/reports/route';
import medicalJournalRoutes from './entities/medicalJournals/route';
import menuItemsRoutes from './entities/menuItems/route';
import healthPassportRoutes from './entities/healthPassport/route';
import documentGenerateRoutes from './entities/documents/generate/route';
import payrollAutomationRoutes from './entities/payroll/automation/route';
import taskListRoutes from './entities/taskList/route';
import childrenRoutes from './entities/children/route';
import childPaymentRoutes from './entities/childPayment/route';
import { initializeTaskScheduler } from './services/taskScheduler';
import mantouxJournalRoutes from './entities/mantouxJournal/route';
import somaticJournalRoutes from './entities/somaticJournal/route';
import staffAttendanceTrackingRoutes from './entities/staffAttendanceTracking/route';
import qwen3ChatRoutes from './entities/qwen3Chat/route';
import uiStateRoutes from './entities/uiState/route';

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'https://aldamiram.vercel.app'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Разрешаем запросы без origin (например, из Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  credentials: false, // ❌ отключаем cookies, используем токены в заголовке Authorization
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Ответ 200 для preflight-запросов
};

// ✅ Добавляем CORS до всех роутов
app.use(cors(corsOptions));
// app.use(cookieParser()); // ❌ отключаем middleware для парсинга cookies, т.к. используем токены в заголовке Authorization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Создаем директорию для загрузки файлов, если она не существует
import fs from 'fs';
import path from 'path';
const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/staff-shifts', staffShiftRoutes);
app.use('/child-attendance', childAttendanceRoutes);
app.use('/attendance', staffAttendanceTrackingRoutes);
app.use('/staff-time-tracking', staffAttendanceTrackingRoutes);
app.use('/payroll', payrollRoutes);
app.use('/rent', rentRoutes); // Добавляем маршрут для аренды
app.use('/settings', settingsRoutes);
app.use('/documents', documentsRoutes);
app.use('/reports', reportsRoutes);
app.use('/medical-journals', medicalJournalRoutes);
app.use('/menu-items', menuItemsRoutes);
app.use('/health-passport', healthPassportRoutes);
app.use('/documents/generate', documentGenerateRoutes);
app.use('/payroll-automation', payrollAutomationRoutes);
app.use('/task-list', taskListRoutes);
app.use('/children', childrenRoutes);
app.use('/child-payments', childPaymentRoutes);
app.use('/somatic-journal', somaticJournalRoutes);
app.use('/mantoux-journal', mantouxJournalRoutes);
app.use('/helminth-journal', helminthJournalRoutes);
app.use('/tub-positive-journal', tubPositiveJournalRoutes);
app.use('/infectious-diseases-journal', infectiousDiseasesJournalRoutes);
app.use('/contact-infection-journal', contactInfectionJournalRoutes);
app.use('/risk-group-children', riskGroupChildrenRoutes);
app.use('/organoleptic-journal', organolepticJournalRoutes);
app.use('/perishable-brak', perishableBrakRoutes);
app.use('/product-certificates', productCertificateRoutes);
app.use('/detergent-log', detergentLogRoutes);
app.use('/food-stock-log', foodStockLogRoutes);
app.use('/food-staff-health', foodStaffHealthRoutes);
app.use('/qwen3-chat', qwen3ChatRoutes);
app.use('/api', uiStateRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Kindergarten Management System API',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Kindergarten Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      health: '/health'
    },
    documentation: 'Refer to the API documentation for details'
  });
});

// Тестовый endpoint для проверки Sentry
app.get('/sentry-test', (req, res) => {
  // Отправляем тестовое сообщение в Sentry
  const Sentry = require('./sentry').default;
  Sentry.captureMessage('Sentry тестовое сообщение из бэкенда');
  
  // Вызываем тестовую ошибку
  throw new Error('Sentry тестовая ошибка из бэкенда');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Отправляем ошибку в Sentry
  const Sentry = require('./sentry').default;
  Sentry.captureException(err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

export default app;
