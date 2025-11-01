import mongoose, { ObjectId } from 'mongoose';
import { IGroup, IGroupInput, IGroupWithChildren } from './model';
import Group from './model';
import Child from '../children/model';

export class GroupService {
  private get groupModel() {
    return Group();
  }
  
  private get childModel() {
    return Child();
  }
  async getAll(userId?: string, role?: string): Promise<any[]> {
    // Admin sees all groups, teachers see only their groups
    const filter = role === 'admin' ? {} : { teacherId: userId };
    const groups = await this.groupModel.find(filter);
    
    // Для каждой группы получаем детей, которые в ней состоят
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
    
    // Получаем детей, которые входят в эту группу
    const children = await this.childModel.find({ groupId: group._id });
    
    return { ...group.toObject(), children };
  }

  async create(data: IGroupInput, userId: string): Promise<IGroup> {
    // Обработка teacherId: если teacher === 'auto' или не указан, используем текущего пользователя
    const teacherIdValue = (typeof data.teacher === 'string' && data.teacher === 'auto') || !data.teacher ? userId : data.teacher;
    
    const groupData = {
      name: data.name,
      description: data.description || '',
      maxStudents: data.maxStudents || 20,
      ageGroup: data.ageGroup,
      isActive: data.isActive !== false, // по умолчанию true
      teacherId: mongoose.Types.ObjectId.isValid(teacherIdValue) ? new mongoose.Types.ObjectId(teacherIdValue) : teacherIdValue,
      createdBy: userId,
      ...data
    };

    // Удаляем поле teacher из данных, чтобы избежать сохранения в базе данных
    delete groupData.teacher;

    const group = new this.groupModel(groupData);
    return await group.save();
  }

  async update(id: string, data: IGroupInput): Promise<IGroup | null> {
    // Если передано поле teacher, обрабатываем его как специальное поле
    const updateData = { ...data };
    if (updateData.teacher !== undefined) {
      // Если teacher === 'auto', используем текущего пользователя (но в данном случае userId не доступен)
      // Просто устанавливаем teacherId равным значению teacher
      updateData.teacherId = new mongoose.Types.ObjectId(updateData.teacher as string);
      delete updateData.teacher; // удаляем оригинальное поле teacher
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