import createMenuItemModel from './model';
import { IMenuItem } from './model';

// Отложенное создание модели
let MenuItemModel: any = null;

const getMenuItemModel = () => {
  if (!MenuItemModel) {
    MenuItemModel = createMenuItemModel();
  }
  return MenuItemModel;
};

export class MenuItemsService {
  async getAll(filters: { category?: string, dayOfWeek?: number, weekNumber?: number, isAvailable?: boolean, createdBy?: string }) {
    const filter: any = {};
    
    if (filters.category) filter.category = filters.category;
    if (filters.dayOfWeek !== undefined) filter.dayOfWeek = filters.dayOfWeek;
    if (filters.weekNumber !== undefined) filter.weekNumber = filters.weekNumber;
    if (filters.isAvailable !== undefined) filter.isAvailable = filters.isAvailable;
    if (filters.createdBy) filter.createdBy = filters.createdBy;
    
    const menuItems = await getMenuItemModel().find(filter)
      .populate('createdBy', 'fullName role')
      .sort({ weekNumber: 1, dayOfWeek: 1, category: 1 });

    return menuItems;
  }

  async getById(id: string) {
    const menuItem = await getMenuItemModel().findById(id)
      .populate('createdBy', 'fullName role');
    
    if (!menuItem) {
      throw new Error('Пункт меню не найден');
    }
    
    return menuItem;
  }

  async create(menuItemData: Partial<IMenuItem>) {
    // Проверяем обязательные поля
    if (!menuItemData.name) {
      throw new Error('Не указано название пункта меню');
    }
    if (!menuItemData.category) {
      throw new Error('Не указана категория');
    }
    if (menuItemData.dayOfWeek === undefined) {
      throw new Error('Не указан день недели');
    }
    if (menuItemData.weekNumber === undefined) {
      throw new Error('Не указан номер недели');
    }
    if (!menuItemData.createdBy) {
      throw new Error('Не указан создатель');
    }
    
    const menuItem = new (getMenuItemModel())(menuItemData);
    await menuItem.save();

    const populatedMenuItem = await getMenuItemModel().findById(menuItem._id)
      .populate('createdBy', 'fullName role');
    
    return populatedMenuItem;
  }

  async update(id: string, data: Partial<IMenuItem>) {
    const updatedMenuItem = await getMenuItemModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('createdBy', 'fullName role');
    
    if (!updatedMenuItem) {
      throw new Error('Пункт меню не найден');
    }
    
    return updatedMenuItem;
  }

  async delete(id: string) {
    const result = await getMenuItemModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Пункт меню не найден');
    }
    
    return { message: 'Пункт меню успешно удален' };
  }

  async getByCategoryAndDay(category: string, dayOfWeek: number, weekNumber?: number) {
    const filter: any = { category, dayOfWeek };
    
    if (weekNumber !== undefined) {
      filter.weekNumber = weekNumber;
    }
    
    const menuItems = await getMenuItemModel().find(filter)
      .populate('createdBy', 'fullName role')
      .sort({ weekNumber: 1 });
    
    return menuItems;
  }

  async getWeeklyMenu(weekNumber: number) {
    const menu = await getMenuItemModel().find({ weekNumber })
      .populate('createdBy', 'fullName role')
      .sort({ dayOfWeek: 1, category: 1 });
    
    // Группируем по дням недели
    const weeklyMenu: any = {};
    for (let i = 0; i <= 6; i++) {
      weeklyMenu[i] = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        dessert: [],
        drink: []
      };
    }
    
    menu.forEach(item => {
      const dayMenu = weeklyMenu[item.dayOfWeek];
      if (dayMenu && dayMenu[item.category]) {
        dayMenu[item.category].push(item);
      }
    });
    
    return weeklyMenu;
  }

  async toggleAvailability(id: string) {
    const menuItem = await getMenuItemModel().findById(id);
    
    if (!menuItem) {
      throw new Error('Пункт меню не найден');
    }
    
    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();
    
    const populatedMenuItem = await getMenuItemModel().findById(menuItem._id)
      .populate('createdBy', 'fullName role');
    
    return populatedMenuItem;
  }

  async searchByName(name: string, category?: string) {
    const filter: any = {
      name: { $regex: name, $options: 'i' }
    };
    
    if (category) {
      filter.category = category;
    }
    
    const menuItems = await getMenuItemModel().find(filter)
      .populate('createdBy', 'fullName role')
      .sort({ name: 1 });
    
    return menuItems;
  }

  async getByAllergen(allergen: string) {
    const menuItems = await getMenuItemModel().find({
      allergens: { $in: [allergen] }
    })
    .populate('createdBy', 'fullName role')
    .sort({ name: 1 });
    
    return menuItems;
  }

  async getNutritionalStatistics() {
    const stats = await getMenuItemModel().aggregate([
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$nutritionalInfo.calories' },
          avgProteins: { $avg: '$nutritionalInfo.proteins' },
          avgFats: { $avg: '$nutritionalInfo.fats' },
          avgCarbs: { $avg: '$nutritionalInfo.carbs' },
          totalItems: { $sum: 1 }
        }
      }
    ]);
    
    return stats[0] || {
      avgCalories: 0,
      avgProteins: 0,
      avgFats: 0,
      avgCarbs: 0,
      totalItems: 0
    };
  }
}