import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Подключение Swagger
import { setupSwagger } from './utils/swagger';


// Импорт новых маршрутов
import userRoutes from './users/user.routes';
import payrollRoutesNew from './payrolls/payroll.routes';
import shiftRoutes from './shifts/shift.routes';
import childRoutes from './children/child.routes';
import reportRoutes from './reports/report.routes';
import documentRoutes from './documents/document.routes';
import groupRoutesNew from './groups/group.routes';
import settingRoutes from './settings/setting.routes';
import childAttendanceRoutesNew from './attendance/child-attendance.routes';
import medicalRoutes from './medical/medical.routes';
import menuRoutes from './menu/menu.routes';
import timeTrackingRoutes from './time-tracking/time-tracking.routes';
import staffShiftRoutes from './shifts/shift.routes';
import staffTimeTrackingRoutes from './time-tracking/time-tracking.routes';
import healthPassportRoutes from './medical/medical.routes';
import documentGenerateRoutes from './documents/document.routes';
import payrollAutomationRoutes from './payrolls/payroll.routes';
import taskListRoutes from './tasks/task-list.routes';
import mantouxJournalRoutes from './medical/medical.routes';
import somaticJournalRoutes from './medical/medical.routes';
import fineRoutes from './finance/finance.routes';
import helminthJournalRoutes from './medical/medical.routes';
import tubPositiveJournalRoutes from './medical/medical.routes';
import infectiousDiseasesJournalRoutes from './medical/medical.routes';
import contactInfectionJournalRoutes from './medical/medical.routes';
import riskGroupChildrenRoutes from './medical/medical.routes';
import organolepticJournalRoutes from './food-control/food-control.routes';
import perishableBrakRoutes from './food-control/food-control.routes';
import productCertificateRoutes from './food-control/food-control.routes';
import detergentLogRoutes from './food-control/food-control.routes';
import foodStockLogRoutes from './food-control/food-control.routes';
import foodStaffHealthRoutes from './food-control/food-control.routes';
import authRoutes from './auth/auth.routes';
import settingsRoutes from './settings/setting.routes';

const allowedLocalhosts = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:5173', // для Vite
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://localhost:3010',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const configuredOrigin = process.env.CORS_ORIGIN;

const corsOptions = {
  origin: (origin: any, callback: any) => {
    console.log('🔍 CORS проверка origin:', origin);
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      console.log('🔍 Origin отсутствует, разрешаем');
      return callback(null, true);
    }

    // If CORS_ORIGIN is explicitly set, allow only that origin
    if (configuredOrigin) {
      const allowed = origin === configuredOrigin;
      console.log('🔍 Проверка configuredOrigin:', origin, '===', configuredOrigin, ':', allowed);
      return callback(null, allowed);
    }

    // Otherwise, in development or when not configured, allow common localhost origins
    const allowed = allowedLocalhosts.includes(origin);
    console.log('🔍 Проверка allowedLocalhosts:', origin, 'в списке:', allowed);
    if (allowed) {
      console.log('🔍 Origin разрешен:', origin);
    } else {
      console.log('❌ Origin запрещен:', origin);
    }
    return callback(null, allowed);
  },
  credentials: true, // Enable credentials (cookies, authorization headers)
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};


const app = express();
setupSwagger(app);
// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutesNew);
app.use('/time-tracking', timeTrackingRoutes);
app.use('/staff-shifts', staffShiftRoutes);
app.use('/child-attendance', childAttendanceRoutesNew);
app.use('/staff-time-tracking', staffTimeTrackingRoutes);
app.use('/payroll', payrollRoutesNew);
app.use('/settings', settingRoutes);
app.use('/documents', documentRoutes);
app.use('/reports', reportRoutes);
app.use('/medical-journals', medicalRoutes);
app.use('/menu-items', menuRoutes);
app.use('/health-passport', healthPassportRoutes);
app.use('/documents/generate', documentGenerateRoutes);
app.use('/payroll-automation', payrollAutomationRoutes);
app.use('/task-list', taskListRoutes);
app.use('/children', childRoutes);
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
app.use('/fine', fineRoutes);
app.use('/settings', settingsRoutes);

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler:', err);
  console.error('❌ Error stack:', err.stack);
  console.error('❌ Request URL:', req.url);
  console.error('❌ Request method:', req.method);
  console.error('❌ Request headers:', req.headers);
  
  // Проверяем, является ли ошибка ошибкой маршрута (404)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON in request body'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`🔍 404 Route not found: ${req.originalUrl}`);
  console.log(`🔍 Request headers:`, req.headers);
  console.log(`🔍 Request method:`, req.method);
  
  // Проверяем, запрашивает ли клиент HTML
  const acceptHeader = req.headers.accept || '';
  const isHtmlRequest = acceptHeader.includes('text/html');
  
  if (isHtmlRequest) {
    console.log('🔍 Client is requesting HTML, returning JSON anyway for API consistency');
  }
  
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

export default app;
