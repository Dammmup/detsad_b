import { IChild } from './model';
import Child from './model';
import Group from '../groups/model';

export class ChildService {
  private get childModel() {
    return Child();
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
    return await child.save();
  }

  async update(id: string, data: Partial<IChild>): Promise<IChild | null> {
    return await this.childModel.findByIdAndUpdate(id, data, { new: true }).populate('groupId');
  }

  async delete(id: string): Promise<boolean> {

    const result = await this.childModel.findByIdAndDelete(id);

    return !!result;

  }

}



export const getChildren = async (filters: any = {}): Promise<IChild[]> => {

  const childModel = Child();

  return await childModel.find(filters);

};

