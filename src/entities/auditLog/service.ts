import AuditLog from './model';

interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  async getAll(filters: AuditLogFilters) {
    const query: any = {};

    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getByEntity(entityType: string, entityId: string, filters: AuditLogFilters = {}) {
    return this.getAll({ ...filters, entityType, entityId });
  }

  async getByEntityType(entityType: string, filters: AuditLogFilters = {}) {
    return this.getAll({ ...filters, entityType });
  }
}
