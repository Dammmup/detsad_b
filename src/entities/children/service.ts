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
    return await cacheService.getOrSet(`${CACHE_KEY_PREFIX}:all`, async () => {
      return await this.childModel.find().populate('groupId');
    }, CACHE_TTL);
  }

  async getById(id: string): Promise<IChild | null> {
    return await cacheService.getOrSet(`${CACHE_KEY_PREFIX}:${id}`, async () => {
      return await this.childModel.findById(id).populate('groupId');
    }, CACHE_TTL);
  }

  async getByGroupId(groupId: string): Promise<IChild[]> {
    return await cacheService.getOrSet(`${CACHE_KEY_PREFIX}:group:${groupId}`, async () => {
      return await this.childModel.find({ groupId }).populate('groupId');
    }, CACHE_TTL);
  }

  async create(data: Partial<IChild>): Promise<IChild> {
    const child = new this.childModel(data);
    const savedChild = await child.save();
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return savedChild;
  }

  async update(id: string, data: Partial<IChild>): Promise<IChild | null> {
    const updated = await this.childModel.findByIdAndUpdate(id, data, { new: true }).populate('groupId');
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.childModel.findByIdAndDelete(id);
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return !!result;
  }

}



export const getChildren = async (filters: any = {}): Promise<IChild[]> => {
  const cacheKey = `${CACHE_KEY_PREFIX}:filter:${JSON.stringify(filters)}`;
  return await cacheService.getOrSet(cacheKey, async () => {
    const childModel = Child;
    return await childModel.find(filters);
  }, CACHE_TTL);
};

