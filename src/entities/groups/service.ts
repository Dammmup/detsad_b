import mongoose, { ObjectId } from 'mongoose';
import { IGroup, IGroupInput, IGroupWithChildren } from './model';
import Group from './model';
import Child from '../children/model';
import Shift from '../staffShifts/model';

export class GroupService {
  private get groupModel() {
    return Group;
  }

  private get childModel() {
    return Child;
  }
  async getAll(userId?: string, role?: string): Promise<any[]> {
    const isFullAccess = ['admin', 'manager', 'director', 'owner'].includes(role || '');
    let filter: any = {};

    if (!isFullAccess && userId) {
      // 1. Ищем сотрудников, которых пользователь заменяет в этом месяце
      const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
      const surrogateShifts = await Shift.find({
        $or: [
          { [`shifts.${currentMonth}`]: { $exists: true }, [`shifts.${currentMonth}.alternativeStaffId`]: new mongoose.Types.ObjectId(userId) },
          // Также ищем по дням, если Map использует конкретные даты "YYYY-MM-DD"
          { "shifts.alternativeStaffId": new mongoose.Types.ObjectId(userId) }
        ]
      });

      const originalStaffIds = surrogateShifts.map(s => s.staffId);

      // 2. Формируем фильтр: свои группы + группы тех, кого заменяем
      filter = {
        $or: [
          { teacherId: userId },
          { assistantId: userId },
          { teacherId: { $in: originalStaffIds } },
          { assistantId: { $in: originalStaffIds } }
        ]
      };
    }

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
    const savedGroup = await group.save();
    return savedGroup;
  }

  async update(id: string, data: IGroupInput): Promise<IGroup | null> {

    const updateData = { ...data };
    if (updateData.teacher !== undefined) {


      updateData.teacherId = new mongoose.Types.ObjectId(updateData.teacher as string);
      delete updateData.teacher;
    }

    const updatedGroup = await this.groupModel.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );
    return updatedGroup;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.groupModel.findByIdAndDelete(id);
    return !!result;
  }
}