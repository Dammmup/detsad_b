import { IGroup } from './model';
import Group from './model';

export class GroupService {
  async getAll(userId?: string, role?: string): Promise<IGroup[]> {
    // Admin sees all groups, teachers see only their groups
    const filter = role === 'admin' ? {} : { teacher: userId };
    return await Group.find(filter);
  }

  async getById(id: string): Promise<IGroup | null> {
    return await Group.findById(id);
  }

  async create(data: Partial<IGroup>, userId: string): Promise<IGroup> {
    const groupData = {
      name: data.name,
      description: data.description || '',
      maxStudents: data.maxStudents || 20,
      ageGroup: data.ageGroup,
      isActive: data.isActive !== false, // по умолчанию true
      // Автоматически назначаем текущего пользователя как teacher
      teacher: typeof data.teacher === 'string' && data.teacher === 'auto' || !data.teacher ? userId : data.teacher,
      createdBy: userId,
      ...data
    };

    const group = new Group(groupData);
    return await group.save();
  }

  async update(id: string, data: Partial<IGroup>): Promise<IGroup | null> {
    return await Group.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await Group.findByIdAndDelete(id);
    return !!result;
  }
}