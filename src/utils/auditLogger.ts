import AuditLog from '../entities/auditLog/model';

interface LogActionParams {
  userId: string;
  userFullName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  details?: string;
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await AuditLog.create({
      userId: params.userId,
      userFullName: params.userFullName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName || '',
      changes: params.changes,
      details: params.details
    });
  } catch (error) {
    console.error('AuditLog error:', error);
  }
}

export function computeChanges(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fieldsToTrack: string[]
): { field: string; oldValue: any; newValue: any }[] {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];

  for (const field of fieldsToTrack) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];

    if (newVal === undefined) continue;

    const oldStr = oldVal?.toString?.() ?? String(oldVal ?? '');
    const newStr = newVal?.toString?.() ?? String(newVal ?? '');

    if (oldStr !== newStr) {
      changes.push({ field, oldValue: oldVal ?? null, newValue: newVal ?? null });
    }
  }

  return changes;
}
