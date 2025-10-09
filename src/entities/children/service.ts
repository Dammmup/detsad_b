import { IChild } from './model';
import Child from './model';
import Group from '../groups/model'; // Добавляем импорт модели Group

export class ChildService {
  async getAll(): Promise<IChild[]> {
    return await Child.find().populate('groupId');
  }

  async getById(id: string): Promise<IChild | null> {
    return await Child.findById(id).populate('groupId');
  }

  async getByGroupId(groupId: string): Promise<IChild[]> {
    return await Child.find({ groupId }).populate('groupId');
  }

  async create(data: Partial<IChild>): Promise<IChild> {
    const child = new Child(data);
    return await child.save();
  }

  async update(id: string, data: Partial<IChild>): Promise<IChild | null> {
    return await Child.findByIdAndUpdate(id, data, { new: true }).populate('groupId');
  }

  async delete(id: string): Promise<boolean> {
    const result = await Child.findByIdAndDelete(id);
    return !!result;
  }
}