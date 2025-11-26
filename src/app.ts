// ...existing code...
import helminthJournalRoutes from './entities/medician/helminthJournal/route';
import tubPositiveJournalRoutes from './entities/medician/tubPositiveJournal/route';
import infectiousDiseasesJournalRoutes from './entities/medician/infectiousDiseasesJournal/route';
import contactInfectionJournalRoutes from './entities/medician/contactInfectionJournal/route';
import riskGroupChildrenRoutes from './entities/medician/riskGroupChildren/route';
import childHealthPassportRoutes from './entities/medician/childHealthPassport/route';
import rentRoutes from './entities/rent/route'; // Добавляем маршрут для аренды
import express from 'express';
import cors from 'cors';
// import cookieParser from 'cookie-parser'; // ❌ полностью убираем поддержку cookies
import organolepticJournalRoutes from './entities/food/organolepticJournal/route';
import perishableBrakRoutes from './entities/food/perishableBrak/route';
import productCertificateRoutes from './entities/food/productCertificates/route';
import detergentLogRoutes from './entities/food/detergentLog/route';
import foodStockLogRoutes from './entities/food/foodStockLog/route';
import foodStaffHealthRoutes from './entities/food/foodStaffHealth/route';
import authRoutes from './entities/auth/route';
import userRoutes from './entities/users/route';
import groupRoutes from './entities/groups/route';
import staffShiftRoutes from './entities/staffShifts/route';
import childAttendanceRoutes from './entities/childAttendance/route';
import payrollRoutes from './entities/payroll/route';
import settingsRoutes from './entities/settings/route';
import documentsRoutes from './entities/documents/route';
import reportsRoutes from './entities/reports/route';
import medicalJournalRoutes from './entities/medician/medicalJournals/route';
import menuItemsRoutes from './entities/food/menuItems/route';
import healthPassportRoutes from './entities/medician/healthPassport/route';
import documentGenerateRoutes from './entities/documents/generate/route';
import payrollAutomationRoutes from './entities/payroll/automation/route';
import taskListRoutes from './entities/taskList/route';
import childrenRoutes from './entities/children/route';
import childPaymentRoutes from './entities/childPayment/route';
import { initializeTaskScheduler } from './services/taskScheduler';
import mantouxJournalRoutes from './entities/medician/mantouxJournal/route';
import somaticJournalRoutes from './entities/medician/somaticJournal/route';
import staffAttendanceTrackingRoutes from './entities/staffAttendanceTracking/route';
import qwen3ChatRoutes from './entities/qwen3Chat/route';
import uiStateRoutes from './entities/uiState/route';
import mainEventsRoutes from './entities/mainEvents/route';
import holidayRoutes from './entities/holidays/route';
import telegramRoutes from './api/telegram';
import exportRoutes from './api/export';
import fs from 'fs';
import path from 'path';
const app = express();


// ✅ Добавляем CORS до всех роутов
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // используем переменную окружения или все источники
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // т.к. cookies ты отключил
};

app.use(cors(corsOptions));

// app.use(cookieParser()); // ❌ полностью убираем middleware для парсинга cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Создаем директорию для загрузки файлов, если она не существует

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
app.use('/child-health-passport', childHealthPassportRoutes);
app.use('/organoleptic-journal', organolepticJournalRoutes);
app.use('/perishable-brak', perishableBrakRoutes);
app.use('/product-certificates', productCertificateRoutes);
app.use('/detergent-log', detergentLogRoutes);
app.use('/food-stock-log', foodStockLogRoutes);
app.use('/food-staff-health', foodStaffHealthRoutes);
app.use('/qwen3-chat', qwen3ChatRoutes);
app.use('/api', uiStateRoutes);
app.use('/api/auth', authRoutes);
app.use('/main-events', mainEventsRoutes);
app.use('/holidays', holidayRoutes);
app.use('/telegram', telegramRoutes);
app.use('/export', exportRoutes);

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
