import mongoose, { ObjectId } from 'mongoose';
import { IGroup, IGroupInput, IGroupWithChildren } from './model';
import Group from './model';
import Child from '../children/model';

export class GroupService {
  private get groupModel() {
    return Group;
  }

  private get childModel() {
    return Child;
  }
  async getAll(userId?: string, role?: string): Promise<any[]> {


    const filter = role === 'admin' ? {} : (userId ? { teacherId: userId } : {});
    const groups = await this.groupModel.find(filter);


    const groupsWithChildren = await Promise.all(
      groups.map(async (group) => {
        const children = await this.childModel.find({ groupId: group._id });
        return { ...group.toObject(), children };
      })
    );

    return groupsWithChildren;
  }

  async getById(id: string): Promise<any | null> {
    const group = await this.groupModel.findById(id);
    if (!group) return null;


    const children = await this.childModel.find({ groupId: group._id });

    return { ...group.toObject(), children };
  }

  async create(data: IGroupInput, userId: string): Promise<IGroup> {

    const teacherIdValue = (typeof data.teacher === 'string' && data.teacher === 'auto') || !data.teacher ? userId : data.teacher;

    const groupData = {
      name: data.name,
      description: data.description || '',
      maxStudents: data.maxStudents || 20,
      ageGroup: data.ageGroup,
      isActive: data.isActive !== false,
      teacherId: mongoose.Types.ObjectId.isValid(teacherIdValue) ? new mongoose.Types.ObjectId(teacherIdValue) : teacherIdValue,
      createdBy: userId,
      ...data
    };


    delete groupData.teacher;

    const group = new this.groupModel(groupData);
    return await group.save();
  }

  async update(id: string, data: IGroupInput): Promise<IGroup | null> {

    const updateData = { ...data };
    if (updateData.teacher !== undefined) {


      updateData.teacherId = new mongoose.Types.ObjectId(updateData.teacher as string);
      delete updateData.teacher;
    }

    return await this.groupModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.groupModel.findByIdAndDelete(id);
    return !!result;
  }
}