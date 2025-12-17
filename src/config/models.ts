/**
 * Централизованный доступ к моделям для Vercel serverless окружения
 * Используйте эти функции вместо прямого импорта из model.ts
 */

import { Model } from 'mongoose';
import { getModel } from './modelRegistry';

// Импорт интерфейсов
import { IUser } from '../entities/users/model';
import { IChild } from '../entities/children/model';
import { IGroup } from '../entities/groups/model';
import { IPayroll } from '../entities/payroll/model';
import { ITask } from '../entities/taskList/model';
import { IRent } from '../entities/rent/model';

// Геттеры для основных моделей
export function getUserModel(): Model<IUser> {
    return getModel<IUser>('User');
}

export function getChildModel(): Model<IChild> {
    return getModel<IChild>('Child');
}

export function getGroupModel(): Model<IGroup> {
    return getModel<IGroup>('Group');
}

export function getPayrollModel(): Model<IPayroll> {
    return getModel<IPayroll>('Payroll');
}

export function getTaskListModel(): Model<ITask> {
    return getModel<ITask>('TaskList');
}

export function getRentModel(): Model<IRent> {
    return getModel<IRent>('Rent');
}

export function getHolidayModel(): Model<any> {
    return getModel<any>('Holiday');
}

export function getStaffShiftModel(): Model<any> {
    return getModel<any>('StaffShift');
}

export function getStaffAttendanceTrackingModel(): Model<any> {
    return getModel<any>('StaffAttendanceTracking');
}

export function getChildAttendanceModel(): Model<any> {
    return getModel<any>('ChildAttendance');
}

export function getChildPaymentModel(): Model<any> {
    return getModel<any>('ChildPayment');
}

export function getMainEventModel(): Model<any> {
    return getModel<any>('MainEvent');
}

export function getReportModel(): Model<any> {
    return getModel<any>('Report');
}

export function getDocumentModel(): Model<any> {
    return getModel<any>('Document');
}

// Медицинские модели
export function getMedicalJournalModel(): Model<any> {
    return getModel<any>('MedicalJournal');
}

export function getSomaticJournalModel(): Model<any> {
    return getModel<any>('SomaticJournal');
}

export function getMantouxJournalModel(): Model<any> {
    return getModel<any>('MantouxJournal');
}

export function getHelminthJournalModel(): Model<any> {
    return getModel<any>('HelminthJournal');
}

export function getInfectiousDiseasesJournalModel(): Model<any> {
    return getModel<any>('InfectiousDiseasesJournal');
}

export function getTubPositiveJournalModel(): Model<any> {
    return getModel<any>('TubPositiveJournal');
}

export function getContactInfectionJournalModel(): Model<any> {
    return getModel<any>('ContactInfectionJournal');
}

export function getRiskGroupChildModel(): Model<any> {
    return getModel<any>('RiskGroupChild');
}

export function getHealthPassportModel(): Model<any> {
    return getModel<any>('HealthPassport');
}

export function getChildHealthPassportModel(): Model<any> {
    return getModel<any>('ChildHealthPassport');
}

// Модели питания
export function getOrganolepticJournalModel(): Model<any> {
    return getModel<any>('OrganolepticJournal');
}

export function getFoodStaffHealthModel(): Model<any> {
    return getModel<any>('FoodStaffHealth');
}

export function getFoodStockLogModel(): Model<any> {
    return getModel<any>('FoodStockLog');
}

export function getPerishableBrakModel(): Model<any> {
    return getModel<any>('PerishableBrak');
}

export function getProductCertificateModel(): Model<any> {
    return getModel<any>('ProductCertificate');
}

export function getDetergentLogModel(): Model<any> {
    return getModel<any>('DetergentLog');
}

export function getMenuItemModel(): Model<any> {
    return getModel<any>('MenuItem');
}

export function getProductModel(): Model<any> {
    return getModel<any>('Product');
}

// Настройки
export function getKindergartenSettingsModel(): Model<any> {
    return getModel<any>('KindergartenSettings');
}

export function getNotificationSettingsModel(): Model<any> {
    return getModel<any>('NotificationSettings');
}

export function getSecuritySettingsModel(): Model<any> {
    return getModel<any>('SecuritySettings');
}

export function getGeolocationSettingsModel(): Model<any> {
    return getModel<any>('GeolocationSettings');
}

export function getUIStateModel(): Model<any> {
    return getModel<any>('UIState');
}
