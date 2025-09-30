// ...existing code...
import helminthJournalRoutes from './routes/helminthJournal';
import tubPositiveJournalRoutes from './routes/tubPositiveJournal';
import infectiousDiseasesJournalRoutes from './routes/infectiousDiseasesJournal';
import contactInfectionJournalRoutes from './routes/contactInfectionJournal';
import riskGroupChildrenRoutes from './routes/riskGroupChildren';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import organolepticJournalRoutes from './routes/organolepticJournal';
import perishableBrakRoutes from './routes/perishableBrak';
import productCertificateRoutes from './routes/productCertificate';
import detergentLogRoutes from './routes/detergentLog';
import foodStockLogRoutes from './routes/foodStockLog';
import foodStaffHealthRoutes from './routes/foodStaffHealth';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import groupRoutes from './routes/group';
import timeTrackingRoutes from './routes/timeTracking';
import staffShiftRoutes from './routes/staffShift';
import childAttendanceRoutes from './routes/childAttendance';
import staffTimeTrackingRoutes from './routes/staffTimeTracking';
import payrollRoutes from './routes/payroll';
import settingsRoutes from './routes/settings';
import documentsRoutes from './routes/documents';
import reportsRoutes from './routes/reports';
import medicalJournalRoutes from './routes/medicalJournal';
import menuItemsRoutes from './routes/menuItems';
import healthPassportRoutes from './routes/healthPassport';
import documentGenerateRoutes from './routes/documentGenerate';
import payrollAutomationRoutes from './routes/payrollAutomation';
import taskListRoutes from './routes/taskList';
import childrenRoutes from './routes/children';
import { initializeTaskScheduler } from './services/taskScheduler';
import mantouxJournalRoutes from './routes/mantouxJournal';
import somaticJournalRoutes from './routes/somaticJournal';

const app = express();

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
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // If CORS_ORIGIN is explicitly set, allow only that origin
    if (configuredOrigin) {
      return callback(null, origin === configuredOrigin);
    }

    // Otherwise, in development or when not configured, allow common localhost origins
    if (allowedLocalhosts.includes(origin)) {
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
app.use('/time-tracking', timeTrackingRoutes);
app.use('/staff-shifts', staffShiftRoutes);
app.use('/child-attendance', childAttendanceRoutes);
app.use('/staff-time-tracking', staffTimeTrackingRoutes);
app.use('/payroll', payrollRoutes);
app.use('/settings', settingsRoutes);
app.use('/documents', documentsRoutes);
app.use('/reports', reportsRoutes);
// Алиасы для простых путей экспорта
const reportsRoutesModule = require('./routes/reports').default || require('./routes/reports');
app.post('/salary/export', reportsRoutesModule);
app.post('/children/export', reportsRoutesModule);
app.post('/attendance/export', reportsRoutesModule);
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
