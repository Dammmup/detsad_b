import { Document, Types } from 'mongoose';
import Finance, { IFinance } from './finance.model';
import User from '../users/user.model';

// Сервис для работы с финансовыми операциями
export class FinanceService {
  // Получение финансовых операций с фильтрацией
  async getFinances(filter: any = {}) {
    try {
      return await Finance.find(filter)
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting finances: ${error}`);
    }
 }

  // Получение финансовой операции по ID
  async getFinanceById(id: string) {
    try {
      return await Finance.findById(id)
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting finance by id: ${error}`);
    }
  }

 // Создание новой финансовой операции
  async createFinance(financeData: Partial<IFinance>) {
    try {
      const finance = new Finance(financeData);
      return await finance.save();
    } catch (error) {
      throw new Error(`Error creating finance: ${error}`);
    }
 }

  // Обновление финансовой операции
  async updateFinance(id: string, financeData: Partial<IFinance>) {
    try {
      return await Finance.findByIdAndUpdate(id, financeData, { new: true })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating finance: ${error}`);
    }
 }

  // Удаление финансовой операции
  async deleteFinance(id: string) {
    try {
      const result = await Finance.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting finance: ${error}`);
    }
 }

  // Получение финансовых операций по типу
  async getFinancesByType(type: 'income' | 'expense') {
    try {
      return await Finance.find({ type })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by type: ${error}`);
    }
  }

  // Получение финансовых операций по категории
  async getFinancesByCategory(category: string) {
    try {
      return await Finance.find({ category })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by category: ${error}`);
    }
  }

  // Получение финансовых операций по статусу
  async getFinancesByStatus(status: 'pending' | 'completed' | 'cancelled') {
    try {
      return await Finance.find({ status })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by status: ${error}`);
    }
  }

  // Получение финансовых операций по пользователю
  async getFinancesByUserId(userId: string) {
    try {
      return await Finance.find({ createdBy: userId })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by user id: ${error}`);
    }
  }

  // Получение финансовых операций за период
  async getFinancesByDateRange(startDate: Date, endDate: Date) {
    try {
      return await Finance.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by date range: ${error}`);
    }
  }

  // Получение финансовых операций по способу оплаты
  async getFinancesByPaymentMethod(paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other') {
    try {
      return await Finance.find({ paymentMethod })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by payment method: ${error}`);
    }
  }

  // Получение статистики по финансовым операциям
  async getFinanceStatistics() {
    try {
      const totalFinances = await Finance.countDocuments();
      const incomeFinances = await Finance.countDocuments({ type: 'income' });
      const expenseFinances = await Finance.countDocuments({ type: 'expense' });
      const pendingFinances = await Finance.countDocuments({ status: 'pending' });
      const completedFinances = await Finance.countDocuments({ status: 'completed' });
      const cancelledFinances = await Finance.countDocuments({ status: 'cancelled' });
      
      // Подсчет общей суммы доходов и расходов
      const incomeAggregation = await Finance.aggregate([
        { $match: { type: 'income', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const expenseAggregation = await Finance.aggregate([
        { $match: { type: 'expense', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const totalIncome = incomeAggregation.length > 0 ? incomeAggregation[0].total : 0;
      const totalExpense = expenseAggregation.length > 0 ? expenseAggregation[0].total : 0;
      
      // Подсчет по категориям
      const categories = await Finance.distinct('category');
      const categoryStats = [];
      
      for (const category of categories) {
        const incomeCount = await Finance.countDocuments({ 
          category, 
          type: 'income',
          status: 'completed'
        });
        
        const expenseCount = await Finance.countDocuments({ 
          category, 
          type: 'expense',
          status: 'completed'
        });
        
        const incomeAmount = await Finance.aggregate([
          { $match: { category, type: 'income', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const expenseAmount = await Finance.aggregate([
          { $match: { category, type: 'expense', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        categoryStats.push({
          category,
          incomeCount,
          expenseCount,
          incomeAmount: incomeAmount.length > 0 ? incomeAmount[0].total : 0,
          expenseAmount: expenseAmount.length > 0 ? expenseAmount[0].total : 0
        });
      }
      
      return {
        total: totalFinances,
        income: incomeFinances,
        expense: expenseFinances,
        pending: pendingFinances,
        completed: completedFinances,
        cancelled: cancelledFinances,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        byCategories: categoryStats
      };
    } catch (error) {
      throw new Error(`Error getting finance statistics: ${error}`);
    }
  }

  // Поиск финансовых операций по названию
  async searchFinancesByName(searchTerm: string) {
    try {
      return await Finance.find({
        title: { $regex: searchTerm, $options: 'i' }
      })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching finances by name: ${error}`);
    }
  }

  // Утверждение финансовой операции
  async approveFinance(id: string, approverId: string) {
    try {
      return await Finance.findByIdAndUpdate(
        id, 
        { 
          status: 'completed',
          approvedBy: approverId,
          approvedAt: new Date()
        }, 
        { new: true }
      )
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error approving finance: ${error}`);
    }
  }

  // Отмена финансовой операции
  async cancelFinance(id: string, reason?: string) {
    try {
      return await Finance.findByIdAndUpdate(
        id, 
        { 
          status: 'cancelled',
          notes: reason || 'Операция отменена'
        }, 
        { new: true }
      )
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error cancelling finance: ${error}`);
    }
  }

  // Получение финансовых операций по тегам
  async getFinancesByTags(tags: string[]) {
    try {
      return await Finance.find({
        tags: { $in: tags }
      })
        .populate('createdBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting finances by tags: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const financeService = new FinanceService();