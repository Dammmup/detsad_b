
import Rent from './model';
import { IRent } from './model';
import { Types } from 'mongoose';
import User from '../users/model';

export class RentService {

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

    return await Rent.find(query)
      .populate('tenantId', 'name type')
      .sort({ createdAt: -1 });
  }


  async getById(id: string) {
    const rent = await Rent.findById(id).populate('tenantId', 'name type');
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    return rent;
  }


  async create(rentData: Partial<IRent>) {
    const rent = new Rent(rentData);
    return await rent.save();
  }


  async update(id: string, updateData: Partial<IRent>) {
    const rent = await Rent.findById(id);

    if (!rent) {
      throw new Error('Аренда не найдена');
    }

    Object.assign(rent, updateData);
    rent.updatedAt = new Date();
    await rent.save();

    return await rent.populate('tenantId', 'name type');
  }


  async delete(id: string) {
    const rent = await Rent.findByIdAndDelete(id);
    if (!rent) {
      throw new Error('Аренда не найдена');
    }
    return { message: 'Аренда успешно удалена' };
  }


  async markAsPaid(id: string) {
    const rent = await Rent.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paymentDate: new Date(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('tenantId', 'name type');

    if (!rent) {
      throw new Error('Аренда не найдена');
    }

    return rent;
  }


  async getByPeriod(period: string) {
    return await Rent.find({ period })
      .populate('tenantId', 'name type');
  }


  async getRentByTenantAndPeriod(tenantId: string, period: string) {
    return await Rent.findOne({
      tenantId: new Types.ObjectId(tenantId),
      period
    }).populate('tenantId', 'name type');
  }


  async createOrUpdateForTenant(tenantId: string, period: string, data: Partial<IRent>) {
    const existingRent = await Rent.findOne({
      tenantId: new Types.ObjectId(tenantId),
      period: period
    });

    if (existingRent) {
      return await Rent.findByIdAndUpdate(existingRent._id, {
        ...data,
        tenantId: new Types.ObjectId(tenantId),
        period,
        updatedAt: new Date()
      }, { new: true, runValidators: true }).populate('tenantId', 'name type');
    } else {
      const rent = new Rent({
        ...data,
        tenantId: new Types.ObjectId(tenantId),
        period
      });
      return await rent.save();
    }
  }

  async generateRentSheets(period: string) {
    try {
      // Lazy import to avoid circular dependency
      const { default: ExternalSpecialist } = await import('../externalSpecialists/model');

      const tenants = await ExternalSpecialist.find({ active: true });

      for (const tenant of tenants) {
        // Получаем баланс за предыдущий период
        const carryOver = await this.getPreviousPeriodBalance((tenant as any)._id.toString(), period);

        await this.createOrUpdateForTenant((tenant as any)._id.toString(), period, {
          tenantId: (tenant as any)._id,
          period: period,
          amount: 0,
          total: carryOver.balance, // Итого к оплате = текущее начисление (0) + долг - переплата
          debt: carryOver.debt,
          overpayment: carryOver.overpayment,
          status: 'active'
        });
      }

      return { message: `Rent sheets successfully generated for period: ${period}`, count: tenants.length };
    } catch (err: any) {
      console.error('Error generating rent sheets:', err);
      throw new Error(err.message || 'Error generating rent sheets');
    }
  }

  /**
   * Получить баланс (сальдо) за предыдущий период
   */
  private async getPreviousPeriodBalance(tenantId: string, currentPeriod: string) {
    const [year, month] = currentPeriod.split('-').map(Number);
    const prevDate = new Date(year, month - 1 - 1, 1);
    const prevPeriod = prevDate.toISOString().slice(0, 7);

    const prevRent = await Rent.findOne({ tenantId: new Types.ObjectId(tenantId), period: prevPeriod });

    if (!prevRent) {
      return { debt: 0, overpayment: 0, balance: 0 };
    }

    // Если в прошлом месяце был долг, он переносится
    // Если была переплата, она тоже переносится
    // Сумма к оплате в новом месяце увеличивается на долг и уменьшается на переплату
    const amount = prevRent.amount || 0;
    const paid = prevRent.paidAmount || 0;
    const diff = amount - paid;

    let debt = 0;
    let overpayment = 0;

    if (diff > 0) {
      debt = diff;
    } else if (diff < 0) {
      overpayment = Math.abs(diff);
    }

    return {
      debt,
      overpayment,
      balance: debt - overpayment
    };
  }
}