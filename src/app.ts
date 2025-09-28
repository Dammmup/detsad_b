// ...existing code...
import helminthJournalRoutes from './routes/helminthJournal';
import tubPositiveJournalRoutes from './routes/tubPositiveJournal';
import infectiousDiseasesJournalRoutes from './routes/infectiousDiseasesJournal';
import contactInfectionJournalRoutes from './routes/contactInfectionJournal';
import riskGroupChildrenRoutes from './routes/riskGroupChildren';
import express from 'express';
import cors from 'cors';
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
import vitaminizationJournalRoutes from './routes/vitaminizationJournal';
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/staff-shifts', staffShiftRoutes);
app.use('/api/child-attendance', childAttendanceRoutes);
app.use('/api/staff-time-tracking', staffTimeTrackingRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/reports', reportsRoutes);
// Алиасы для простых путей экспорта
const reportsRoutesModule = require('./routes/reports').default || require('./routes/reports');
app.post('/api/salary/export', reportsRoutesModule);
app.post('/api/children/export', reportsRoutesModule);
app.post('/api/attendance/export', reportsRoutesModule);
app.use('/api/medical-journals', medicalJournalRoutes);
app.use('/api/vitaminization-journal', vitaminizationJournalRoutes);
app.use('/api/menu-items', menuItemsRoutes);
app.use('/api/health-passport', healthPassportRoutes);
app.use('/api/documents/generate', documentGenerateRoutes);
app.use('/api/payroll-automation', payrollAutomationRoutes);
app.use('/api/task-list', taskListRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/somatic-journal', somaticJournalRoutes);
app.use('/api/mantoux-journal', mantouxJournalRoutes);
app.use('/api/helminth-journal', helminthJournalRoutes);
app.use('/api/tub-positive-journal', tubPositiveJournalRoutes);
app.use('/api/infectious-diseases-journal', infectiousDiseasesJournalRoutes);
app.use('/api/contact-infection-journal', contactInfectionJournalRoutes);
app.use('/api/risk-group-children', riskGroupChildrenRoutes);
app.use('/api/organoleptic-journal', organolepticJournalRoutes);
app.use('/api/perishable-brak', perishableBrakRoutes);
app.use('/api/product-certificates', productCertificateRoutes);
app.use('/api/detergent-log', detergentLogRoutes);
app.use('/api/food-stock-log', foodStockLogRoutes);
app.use('/api/food-staff-health', foodStaffHealthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Kindergarten Management System API',
    timestamp: new Date().toISOString()
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
