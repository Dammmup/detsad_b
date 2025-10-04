import { Document, Types } from 'mongoose';
import Group, { IGroup } from './group.model';
import Child from '../children/child.model';
import User from '../users/user.model';

// Сервис для работы с группами
export class GroupService {
  // Получение групп с фильтрацией
  async getGroups(filter: any = {}) {
    try {
      return await Group.find(filter)
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role');
    } catch (error) {
      throw new Error(`Error getting groups: ${error}`);
    }
 }

  // Получение группы по ID
  async getGroupById(id: string) {
    try {
      return await Group.findById(id)
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role');
    } catch (error) {
      throw new Error(`Error getting group by id: ${error}`);
    }
  }

 // Создание новой группы
  async createGroup(groupData: Partial<IGroup>) {
    try {
      const group = new Group(groupData);
      return await group.save();
    } catch (error) {
      throw new Error(`Error creating group: ${error}`);
    }
 }

  // Обновление группы
  async updateGroup(id: string, groupData: Partial<IGroup>) {
    try {
      return await Group.findByIdAndUpdate(id, groupData, { new: true })
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role');
    } catch (error) {
      throw new Error(`Error updating group: ${error}`);
    }
  }

  // Удаление группы
  async deleteGroup(id: string) {
    try {
      const result = await Group.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting group: ${error}`);
    }
 }

  // Получение групп по воспитателю
  async getGroupsByTeacherId(teacherId: string) {
    try {
      return await Group.find({ teacherId })
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role');
    } catch (error) {
      throw new Error(`Error getting groups by teacher id: ${error}`);
    }
  }

  // Получение активных групп
  async getActiveGroups() {
    try {
      return await Group.find({ active: true })
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role');
    } catch (error) {
      throw new Error(`Error getting active groups: ${error}`);
    }
  }

  // Получение детей в группе
  async getChildrenInGroup(groupId: string) {
    try {
      return await Child.find({ groupId, active: true })
        .populate('parentId', 'fullName phone role')
        .sort({ fullName: 1 });
    } catch (error) {
      throw new Error(`Error getting children in group: ${error}`);
    }
  }

  // Получение статистики групп
  async getGroupStatistics() {
    try {
      const totalGroups = await Group.countDocuments({ active: true });
      const inactiveGroups = await Group.countDocuments({ active: false });
      
      // Получаем количество детей в каждой группе
      const groups = await Group.find({ active: true });
      const groupStats = [];
      
      for (const group of groups) {
        const childCount = await Child.countDocuments({ 
          groupId: group._id,
          active: true 
        });
        groupStats.push({
          groupId: group._id,
          groupName: group.name,
          childCount,
          maxChildren: group.maxStudents,
          currentChildrenCount: group.currentChildrenCount,
          teacherId: group.teacherId,
          assistantTeacherId: group.assistantTeacherId
        });
      }
      
      return {
        total: totalGroups,
        inactive: inactiveGroups,
        byGroups: groupStats
      };
    } catch (error) {
      throw new Error(`Error getting group statistics: ${error}`);
    }
  }

  // Обновление количества детей в группе
  async updateChildrenCount(groupId: string) {
    try {
      const childCount = await Child.countDocuments({ 
        groupId,
        active: true 
      });
      
      return await Group.findByIdAndUpdate(
        groupId,
        { currentChildrenCount: childCount },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating children count: ${error}`);
    }
  }

  // Поиск групп по названию
  async searchGroupsByName(searchTerm: string) {
    try {
      return await Group.find({
        name: { $regex: searchTerm, $options: 'i' },
        active: true
      })
        .populate('teacherId', 'fullName phone role')
        .populate('assistantTeacherId', 'fullName phone role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching groups by name: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const groupService = new GroupService();