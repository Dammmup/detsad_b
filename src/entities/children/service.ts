import { IChild } from './model';
import Child from './model';
import Group from '../groups/model';
import { cacheService } from '../../services/cache';

const CACHE_KEY_PREFIX = 'children';
const CACHE_TTL = 3600; // 1 hour

export class ChildService {
  private get childModel() {
    return Child;
  }
  async getAll(): Promise<IChild[]> {
    return await this.childModel.find().populate('groupId');
  }

  async getById(id: string): Promise<IChild | null> {
    return await this.childModel.findById(id).populate('groupId');
  }

  async getByGroupId(groupId: string): Promise<IChild[]> {
    return await this.childModel.find({ groupId }).populate('groupId');
  }

  async create(data: Partial<IChild>): Promise<IChild> {
    const child = new this.childModel(data);
    const savedChild = await child.save();
    return savedChild;
  }

  async update(id: string, data: Partial<IChild>): Promise<IChild | null> {
    const updated = await this.childModel.findByIdAndUpdate(id, data, { new: true }).populate('groupId');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.childModel.findByIdAndDelete(id);
    return !!result;
  }

}



export const getChildren = async (filters: any = {}): Promise<IChild[]> => {
  const childModel = Child;
  return await childModel.find(filters);
};

