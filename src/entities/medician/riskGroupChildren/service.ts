import RiskGroupChild from './model';
import { IRiskGroupChild } from './model';
import Child from '../../children/model';

export class RiskGroupChildrenService {
  async getAll(filters: { childId?: string }) {
    const filter: any = {};

    if (filters.childId) filter.childId = filters.childId;

    const children = await RiskGroupChild.find(filter)
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return children;
  }

  async getById(id: string) {
    const child = await RiskGroupChild.findById(id)
      .populate('childId', 'fullName birthday address');

    if (!child) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }

    return child;
  }

  async create(childData: Partial<IRiskGroupChild>, userId: string) {
    if (!childData.childId) {
      throw new Error('Не указан ребенок');
    }
    if (!childData.date) {
      childData.date = new Date();
    }

    const child = await Child.findById(childData.childId);
    if (!child) {
      throw new Error('Ребенок не найден');
    }

    const riskChild = new RiskGroupChild(childData);
    await riskChild.save();

    const populatedChild = await RiskGroupChild.findById(riskChild._id)
      .populate('childId', 'fullName birthday address');

    return populatedChild;
  }

  async update(id: string, data: Partial<IRiskGroupChild>) {
    const updatedChild = await RiskGroupChild.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('childId', 'fullName birthday address');

    if (!updatedChild) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }

    return updatedChild;
  }

  async delete(id: string) {
    const result = await RiskGroupChild.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись ребенка из группы риска не найдена');
    }

    return { message: 'Запись ребенка из группы риска успешно удалена' };
  }

  async getByChildId(childId: string) {
    const children = await RiskGroupChild.find({ childId })
      .populate('childId', 'fullName birthday address')
      .sort({ date: -1 });

    return children;
  }
}