import { connectDatabases } from './database';
import { Model } from 'mongoose';



// Импортируем и регистрируем все фабрики моделей
// Медицинские журналы
import medicalJournalFactory from '../entities/medician/medicalJournals/model';
import somaticJournalFactory from '../entities/medician/somaticJournal/model';
import mantouxJournalFactory from '../entities/medician/mantouxJournal/model';
import helminthJournalFactory from '../entities/medician/helminthJournal/model';
import infectiousDiseasesJournalFactory from '../entities/medician/infectiousDiseasesJournal/model';
import tubPositiveJournalFactory from '../entities/medician/tubPositiveJournal/model';
import contactInfectionJournalFactory from '../entities/medician/contactInfectionJournal/model';
import riskGroupChildrenFactory from '../entities/medician/riskGroupChildren/model';

// Журналы по питанию
import organolepticJournalFactory from '../entities/food/organolepticJournal/model';
import foodStaffHealthFactory from '../entities/food/foodStaffHealth/model';
import foodStockLogFactory from '../entities/food/foodStockLog/model';
import perishableBrakFactory from '../entities/food/perishableBrak/model';
import productCertificatesFactory from '../entities/food/productCertificates/model';
import detergentLogFactory from '../entities/food/detergentLog/model';

// Остальные модели
import userFactory from '../entities/users/model';
import childrenFactory from '../entities/children/model';
import groupFactory from '../entities/groups/model';
// Тип для фабрики модели
type ModelFactory<T> = () => Model<T>;

// Регистр моделей
const modelRegistry: Record<string, any> = {};

// Функция для регистрации фабрики модели
export function registerModelFactory<T>(name: string, factory: ModelFactory<T>) {
  modelRegistry[name] = factory;
}

// Функция для получения модели по имени
export function getModel<T>(name: string): Model<T> {
  if (!modelRegistry[name]) {
    throw new Error(`Модель ${name} не зарегистрирована. Проверьте, что все модели зарегистрированы и подключение к базе данных выполнено.`);
  }
  return modelRegistry[name];
}

// Функция для инициализации всех моделей после подключения к базе данных
export async function initializeModels(): Promise<void> {
  // Сначала подключаемся к базам данных
  await connectDatabases();
  
  // Затем инициализируем все зарегистрированные модели
  Object.keys(modelRegistry).forEach(modelName => {
    if (typeof modelRegistry[modelName] === 'function') {
      // Вызываем фабрику для создания модели
      modelRegistry[modelName] = modelRegistry[modelName]();
    }
  });
}
// Регистрируем все фабрики
registerModelFactory('MedicalJournal', medicalJournalFactory);
registerModelFactory('SomaticJournal', somaticJournalFactory);
registerModelFactory('MantouxJournal', mantouxJournalFactory);
registerModelFactory('HelminthJournal', helminthJournalFactory);
registerModelFactory('InfectiousDiseasesJournal', infectiousDiseasesJournalFactory);
registerModelFactory('TubPositiveJournal', tubPositiveJournalFactory);
registerModelFactory('ContactInfectionJournal', contactInfectionJournalFactory);
registerModelFactory('RiskGroupChild', riskGroupChildrenFactory);

registerModelFactory('OrganolepticJournal', organolepticJournalFactory);
registerModelFactory('FoodStaffHealth', foodStaffHealthFactory);
registerModelFactory('FoodStockLog', foodStockLogFactory);
registerModelFactory('PerishableBrak', perishableBrakFactory);
registerModelFactory('ProductCertificate', productCertificatesFactory);
registerModelFactory('DetergentLog', detergentLogFactory);

// Праздники
import holidayFactory from '../entities/holidays/model';

registerModelFactory('User', userFactory);
registerModelFactory('Child', childrenFactory);
registerModelFactory('Group', groupFactory);
registerModelFactory('Holiday', holidayFactory);

// Регистрируем модели настроек
registerModelFactory('KindergartenSettings', () => (require('../entities/settings/model') as any).createKindergartenSettingsModel());
registerModelFactory('NotificationSettings', () => (require('../entities/settings/model') as any).createNotificationSettingsModel());
registerModelFactory('SecuritySettings', () => (require('../entities/settings/model') as any).createSecuritySettingsModel());
registerModelFactory('GeolocationSettings', () => (require('../entities/settings/model') as any).createGeolocationSettingsModel());

// Регистрируем остальные модели, которые использовали прямой вызов mongoose.model()
registerModelFactory('Report', () => (require('../entities/reports/model') as any).default());
registerModelFactory('Document', () => (require('../entities/documents/model') as any).default());
registerModelFactory('HealthPassport', () => (require('../entities/medician/healthPassport/model') as any).default());
registerModelFactory('MenuItem', () => (require('../entities/food/menuItems/model') as any).default());
registerModelFactory('Product', () => (require('../entities/food/products/model') as any).default());
registerModelFactory('MainEvent', () => (require('../entities/mainEvents/model') as any).default());
registerModelFactory('UIState', () => (require('../entities/uiState/service') as any).getUIStateModel());
registerModelFactory('Payroll', () => (require('../entities/payroll/model') as any).default());
registerModelFactory('StaffAttendanceTracking', () => (require('../entities/staffAttendanceTracking/model') as any).default());
registerModelFactory('StaffShift', () => (require('../entities/staffShifts/model') as any).default());
registerModelFactory('ChildAttendance', () => (require('../entities/childAttendance/model') as any).default());
registerModelFactory('ChildPayment', () => (require('../entities/childPayment/model') as any).default());
registerModelFactory('Rent', () => (require('../entities/rent/model') as any).default());
registerModelFactory('TaskList', () => (require('../entities/taskList/model') as any).default());
registerModelFactory('ChildHealthPassport', () => (require('../entities/medician/childHealthPassport/model') as any).default());