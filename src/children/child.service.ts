import { Document, Types } from 'mongoose';
import Child, { IChild } from './child.model';
import Group from '../groups/group.model';
import User from '../users/user.model';

// Сервис для работы с детьми
export class ChildService {
  // Получение детей с фильтрацией
  async getChildren(filter: any = {}) {
    try {
      return await Child.find(filter)
        .populate('groupId', 'name description teacherId assistantTeacherId');
    } catch (error) {
      throw new Error(`Error getting children: ${error}`);
    }
  }

  // Получение ребенка по ID
  async getChildById(id: string) {
    try {
      return await Child.findById(id)
        .populate('groupId', 'name description teacherId assistantTeacherId');
    } catch (error) {
      throw new Error(`Error getting child by id: ${error}`);
    }
  }

  // Создание нового ребенка
  async createChild(childData: Partial<IChild>) {
    try {
      const child = new Child(childData);
      return await child.save();
    } catch (error) {
      throw new Error(`Error creating child: ${error}`);
    }
  }

  // Обновление ребенка
  async updateChild(id: string, childData: Partial<IChild>) {
    try {
      return await Child.findByIdAndUpdate(id, childData, { new: true })
        .populate('groupId', 'name description teacherId assistantTeacherId');
    } catch (error) {
      throw new Error(`Error updating child: ${error}`);
    }
  }

  // Удаление ребенка
  async deleteChild(id: string) {
    try {
      const result = await Child.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting child: ${error}`);
    }
  }

  // Получение детей по группе
  async getChildrenByGroupId(groupId: string) {
    try {
      return await Child.find({ groupId, active: true })
        .populate('groupId', 'name description teacherId assistantTeacherId')
        .sort({ fullName: 1 });
    } catch (error) {
      throw new Error(`Error getting children by group id: ${error}`);
    }
  }

  // Получение детей по родителю
  async getChildrenByParentId(parentId: string) {
    try {
      return await Child.find({ parentId, active: true })
        .populate('groupId', 'name description teacherId assistantTeacherId')
        .sort({ fullName: 1 });
    } catch (error) {
      throw new Error(`Error getting children by parent id: ${error}`);
    }
  }

  // Получение детей по возрастной группе
  async getChildrenByAgeGroup(ageGroup: string) {
    try {
      // Получаем группы по возрастной категории
      const groups = await Group.find({ ageGroup, active: true });
      const groupIds = groups.map(group => group._id);
      
      // Получаем детей в этих группах
      return await Child.find({ 
        groupId: { $in: groupIds },
        active: true 
      })
        .populate('groupId', 'name description teacherId assistantTeacherId')
        .populate('parentId', 'fullName phone role')
        .sort({ fullName: 1 });
    } catch (error) {
      throw new Error(`Error getting children by age group: ${error}`);
    }
  }

  // Получение статистики по детям
  async getChildrenStatistics() {
    try {
      const totalChildren = await Child.countDocuments({ active: true });
      const inactiveChildren = await Child.countDocuments({ active: false });
      
      // Получаем количество детей по группам
      const groups = await Group.find({ active: true });
      const groupStats = [];
      
      for (const group of groups) {
        const count = await Child.countDocuments({ 
          groupId: group._id,
          active: true 
        });
        groupStats.push({
          groupId: group._id,
          groupName: group.name,
          count
        });
      }
      
      return {
        total: totalChildren,
        inactive: inactiveChildren,
        byGroups: groupStats
      };
    } catch (error) {
      throw new Error(`Error getting children statistics: ${error}`);
    }
  }

  // Поиск детей по имени
  async searchChildrenByName(searchTerm: string) {
    try {
      return await Child.find({
        fullName: { $regex: searchTerm, $options: 'i' },
        active: true
      })
        .populate('groupId', 'name description teacherId assistantTeacherId')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching children by name: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const childService = new ChildService();