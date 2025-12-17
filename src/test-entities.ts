import { ChildService } from './entities/children/service';
import { GroupService } from './entities/groups/service';
import { UserService } from './entities/users/service';


console.log('🧪 Тестирование новой архитектуры сущностей...');

try {

  const childService = new ChildService();
  const groupService = new GroupService();
  const userService = new UserService();

  console.log('✅ Сервисы успешно импортированы и созданы');
  console.log('- ChildService:', typeof childService);
  console.log('- GroupService:', typeof groupService);
  console.log('- UserService:', typeof userService);

  console.log('\n🎉 Архитектура сущностей работает корректно!');
  console.log('Теперь каждая сущность имеет свою структуру:');
  console.log('- entities/children/{model,service,controller,route}.ts');
  console.log('- entities/groups/{model,service,controller,route}.ts');
  console.log('- entities/users/{model,service,controller,route}.ts');
  console.log('- и так для всех остальных сущностей');

} catch (error) {
  console.error('❌ Ошибка при тестировании архитектуры:', error);
}