import Rent from './model';
import { IRent } from './model';
import { Types } from 'mongoose';

export class RentService {
  // Получить все аренды с фильтрацией
  async getAll(filters: { 
    tenantId?: string; 
    period?: string; 
    status?: string;
  } = {}) {
    const query: any = {};

    if (filters.tenantId) {
      query.tenantId = new Types.ObjectId(filters.tenantId);
    }
    
    if (filters.period) {
      query.period = filters.period;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    return await Rent().find(query)
      .populate('tenantId', 'fullName role')
      .sort({ createdAt: -1 });
  }

  // Получить аренду по ID
  async getById(id: string) {
    const rent = await Rent().findById(id).populate('tenantId', 'fullName role');
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    return rent;
  }

  // Создать новую аренду
  async create(rentData: Partial<IRent>) {
    const rent = new (Rent())(rentData);
    return await rent.save();
  }

 // Обновить аренду
  async update(id: string, updateData: Partial<IRent>) {
    const rent = await Rent().findByIdAndUpdate(id, updateData, { new: true })
      .populate('tenantId', 'fullName role');
    
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    
    return rent;
  }

  // Удалить аренду
  async delete(id: string) {
    const rent = await Rent().findByIdAndDelete(id);
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    return { message: 'Аренда успешно удалена' };
  }

  // Отметить аренду как оплаченную
  async markAsPaid(id: string) {
    const rent = await Rent().findByIdAndUpdate(
      id, 
      { 
        status: 'paid',
        paymentDate: new Date()
      }, 
      { new: true }
    ).populate('tenantId', 'fullName role');
    
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    
    return rent;
  }

  // Получить аренды для конкретного периода
  async getByPeriod(period: string) {
    return await Rent().find({ period })
      .populate('tenantId', 'fullName role');
  }

  // Проверить существование аренды для конкретного арендатора и периода
  async getRentByTenantAndPeriod(tenantId: string, period: string) {
    return await Rent().findOne({
      tenantId: new Types.ObjectId(tenantId),
      period
    }).populate('tenantId', 'fullName role');
  }

 // Создать или обновить аренду для конкретного арендатора и периода
async createOrUpdateForTenant(tenantId: string, period: string, data: Partial<IRent>) {
  const existingRent = await Rent().findOne({
    tenantId: new Types.ObjectId(tenantId),
    period: period
  });
  
  if (existingRent) {
    return await Rent().findByIdAndUpdate(existingRent._id, {
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      period
    }, { new: true }).populate('tenantId', 'fullName role');
  } else {
    const rent = new (Rent())({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      period
    });
    return await rent.save();
  }
}

/**
 * Generate rent sheets for all tenants
 * @param {string} period - Period in YYYY-MM format
 * @returns {Promise<any>} Success response
 */
async generateRentSheets(period: string) {
  try {
    // Import necessary models
    const User = (await import('../users/model')).default;
    
    // Get all tenants (users with role !== 'admin')
    const tenants = await User().find({ role: { $ne: 'admin' } });
    
    // Generate rent sheets for each tenant
    for (const tenant of tenants) {
      // Calculate rent data
      // In real system, here will be more complex rent calculation logic
      // Create or update rent record
      await this.createOrUpdateForTenant((tenant as any)._id.toString(), period, {
        tenantId: (tenant as any)._id,
        period: period,
        amount: 0,
        total: 0,
        status: 'active'
      });
    }
    
    return { message: `Rent sheets successfully generated for period: ${period}`, count: tenants.length };
  } catch (err: any) {
    console.error('Error generating rent sheets:', err);
    throw new Error(err.message || 'Error generating rent sheets');
  }
}
}