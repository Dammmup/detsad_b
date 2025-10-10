// ...existing code...
import helminthJournalRoutes from './entities/helminthJournal/route';
import tubPositiveJournalRoutes from './entities/tubPositiveJournal/route';
import infectiousDiseasesJournalRoutes from './entities/infectiousDiseasesJournal/route';
import contactInfectionJournalRoutes from './entities/contactInfectionJournal/route';
import riskGroupChildrenRoutes from './entities/riskGroupChildren/route';
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
import { initializeTaskScheduler } from './services/taskScheduler';
import mantouxJournalRoutes from './entities/mantouxJournal/route';
import somaticJournalRoutes from './entities/somaticJournal/route';
import staffAttendanceTrackingRoutes from './entities/staffAttendanceTracking/route';

const app = express();

const allowedOrigins = [
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
  'http://127.0.0.1:5173',
  'https://detsad-b.vercel.app', // домен Vercel для фронтенда
  'https://*.vercel.app' // поддержка других Vercel доменов
];

// Проверяем, установлены ли специфичные CORS переменные
const configuredOrigin = process.env.CORS_ORIGIN;

const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // If CORS_ORIGIN is explicitly set, allow only that origin
    if (configuredOrigin) {
      if (Array.isArray(configuredOrigin)) {
        return callback(null, configuredOrigin.includes(origin));
      } else {
        // Поддержка нескольких доменов через запятую
        const origins = configuredOrigin.split(',').map(o => o.trim());
        return callback(null, origins.includes(origin));
      }
    }

    // Otherwise, in development or when not configured, allow common localhost origins and Vercel domains
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Fallback: reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Enable credentials (cookies, authorization headers)
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};
// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/staff-shifts', staffShiftRoutes);
app.use('/child-attendance', childAttendanceRoutes);
app.use('/attendance', staffAttendanceTrackingRoutes);
app.use('/staff-time-tracking', staffAttendanceTrackingRoutes);
app.use('/payroll', payrollRoutes);
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
  console.error('Error:', err);
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
