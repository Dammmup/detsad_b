# Схема базы данных MongoDB для AI-ассистента

## Важная информация

- **Текущее время**: Используй текущую дату/время, которые я предоставлю в контексте
- **Часовой пояс**: Казахстан (UTC+5), при работе с датами используй `+05:00`
- **ObjectId**: Для связей между коллекциями используются `ObjectId`. При поиске по связям используй `$lookup` в aggregate

---

## Коллекции

### users (Сотрудники)

Коллекция для хранения информации о сотрудниках и пользователях системы.

| Поле      | Тип   | Описание                                                                                                                                                               |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_id`       | ObjectId | Уникальный идентификатор                                                                                                                                |
| `fullName`  | String   | ФИО сотрудника                                                                                                                                                    |
| `phone`     | String   | Телефон (уникальный)                                                                                                                                          |
| `role`      | String   | Роль:`admin`, `teacher`, `assistant`, `nurse`, `cook`, `cleaner`, `security`, `psychologist`, `music_teacher`, `physical_teacher`, `staff`, `rent` |
| `active`    | Boolean  | Активен ли сотрудник (true = работает, false = уволен)                                                                                         |
| `birthday`  | Date     | Дата рождения                                                                                                                                                      |
| `iin`       | String   | ИИН (индивидуальный идентификационный номер)                                                                                            |
| `groupId`   | ObjectId | Ссылка на группу (для воспитателей)                                                                                                               |
| `notes`     | String   | Заметки                                                                                                                                                                 |
| `photo`     | String   | Путь к фото                                                                                                                                                           |
| `tenant`    | Boolean  | Арендатор (true/false)                                                                                                                                                |
| `createdAt` | Date     | Дата создания                                                                                                                                                      |
| `updatedAt` | Date     | Дата обновления                                                                                                                                                  |

**Примеры запросов:**

- Активные сотрудники: `{ "active": true, "role": { "$ne": "admin" } }`
- Воспитатели: `{ "role": "teacher", "active": true }`
- Арендаторы: `{ "tenant": true }`

---

### children (Дети)

Информация о детях, посещающих детский сад.

| Поле        | Тип   | Описание                                |
| --------------- | -------- | ----------------------------------------------- |
| `_id`         | ObjectId | Уникальный идентификатор |
| `fullName`    | String   | ФИО ребёнка                           |
| `birthday`    | Date     | Дата рождения                       |
| `groupId`     | ObjectId | Ссылка на группу                  |
| `active`      | Boolean  | Посещает ли ребёнок сад     |
| `parentName`  | String   | ФИО родителя                         |
| `parentPhone` | String   | Телефон родителя                 |
| `address`     | String   | Адрес                                      |
| `iin`         | String   | ИИН ребёнка                           |
| `gender`      | String   | Пол                                          |
| `allergy`     | String   | Аллергии                                |
| `notes`       | String   | Заметки                                  |

---

### groups (Группы)

Группы детского сада.

| Поле        | Тип   | Описание                                                     |
| --------------- | -------- | -------------------------------------------------------------------- |
| `_id`         | ObjectId | Уникальный идентификатор                      |
| `name`        | String   | Название группы (например, "Солнышко") |
| `description` | String   | Описание                                                     |
| `ageGroup`    | String   | Возрастная группа                                    |
| `maxStudents` | Number   | Максимальное количество детей             |
| `isActive`    | Boolean  | Активна ли группа                                     |
| `teacherId`   | ObjectId | Ссылка на воспитателя                             |
| `assistantId` | ObjectId | Ссылка на помощника воспитателя          |

---

### staff_attendance_tracking (Посещаемость сотрудников)

Отметки прихода/ухода сотрудников.

| Поле                   | Тип   | Описание                                |
| -------------------------- | -------- | ----------------------------------------------- |
| `_id`                    | ObjectId | Уникальный идентификатор |
| `staffId`                | ObjectId | Ссылка на сотрудника (users)  |
| `date`                   | Date     | Дата                                        |
| `actualStart`            | Date     | Время прихода (clock-in)            |
| `actualEnd`              | Date     | Время ухода (clock-out)               |
| `totalHours`             | Number   | Отработано часов                 |
| `lateMinutes`            | Number   | Минут опоздания                   |
| `earlyLeaveMinutes`      | Number   | Минут раннего ухода            |
| `inZone`                 | Boolean  | Был ли в зоне геолокации    |
| `penalties.late.minutes` | Number   | Минуты опоздания                 |
| `penalties.late.amount`  | Number   | Сумма штрафа                         |
| `notes`                  | String   | Заметки                                  |

**Важно для запросов по дате:**

- Для поиска записей за сегодня используй:
  ```json
  {
    "date": {
      "$gte": "2025-12-23T00:00:00+05:00",
      "$lt": "2025-12-24T00:00:00+05:00"
    }
  }
  ```

---

### staff_shifts (Смены сотрудников)

Запланированные смены.

| Поле      | Тип   | Описание                                |
| ------------- | -------- | ----------------------------------------------- |
| `_id`       | ObjectId | Уникальный идентификатор |
| `staffId`   | ObjectId | Ссылка на сотрудника          |
| `date`      | String   | Дата в формате "YYYY-MM-DD"         |
| `startTime` | String   | Время начала "HH:MM"                 |
| `endTime`   | String   | Время окончания "HH:MM"           |
| `status`    | String   | Статус смены                         |

---

### childattendances (Посещаемость детей)

Отметки посещаемости детей.

| Поле        | Тип   | Описание                                             |
| --------------- | -------- | ------------------------------------------------------------ |
| `_id`         | ObjectId | Уникальный идентификатор              |
| `childId`     | ObjectId | Ссылка на ребёнка                             |
| `groupId`     | ObjectId | Ссылка на группу                               |
| `date`        | Date     | Дата                                                     |
| `status`      | String   | Статус:`present`, `absent`, `sick`, `vacation` |
| `actualStart` | Date     | Время прихода                                    |
| `actualEnd`   | Date     | Время ухода                                        |
| `markedBy`    | ObjectId | Кто отметил                                        |

---

### payrolls (Зарплаты)

Расчётные листы.

| Поле          | Тип   | Описание                                |
| ----------------- | -------- | ----------------------------------------------- |
| `_id`           | ObjectId | Уникальный идентификатор |
| `staffId`       | ObjectId | Ссылка на сотрудника          |
| `period`        | String   | Период "YYYY-MM"                          |
| `baseSalary`    | Number   | Базовая зарплата                 |
| `bonuses`       | Number   | Бонусы                                    |
| `penalties`     | Number   | Штрафы                                    |
| `latePenalties` | Number   | Штрафы за опоздания            |
| `total`         | Number   | Итого к выплате                    |
| `status`        | String   | Статус:`draft`, `approved`, `paid`  |
| `workedShifts`  | Number   | Отработано смен                   |
| `workedDays`    | Number   | Отработано дней                   |

---

### tasks (Задачи)

Список задач.

| Поле        | Тип   | Описание                                                        |
| --------------- | -------- | ----------------------------------------------------------------------- |
| `_id`         | ObjectId | Уникальный идентификатор                         |
| `title`       | String   | Название задачи                                           |
| `description` | String   | Описание                                                        |
| `assignee`    | ObjectId | Исполнитель                                                  |
| `dueDate`     | Date     | Срок выполнения                                           |
| `status`      | String   | Статус:`pending`, `in_progress`, `completed`, `cancelled` |
| `priority`    | String   | Приоритет:`low`, `medium`, `high`                        |

---

### child_payments (Платежи за детей)

Оплаты за посещение.

| Поле    | Тип   | Описание                                |
| ----------- | -------- | ----------------------------------------------- |
| `_id`     | ObjectId | Уникальный идентификатор |
| `childId` | ObjectId | Ссылка на ребёнка                |
| `amount`  | Number   | Сумма                                      |
| `period`  | String   | Период "YYYY-MM"                          |
| `status`  | String   | Статус оплаты                       |
| `paidAt`  | Date     | Дата оплаты                           |

---

---

## Примеры сложных запросов

### Найти сотрудников, не отметившихся сегодня до 9 утра

```json
{
  "collection": "users",
  "operation": "aggregate",
  "pipeline": [
    { "$match": { "active": true, "role": { "$ne": "admin" } } },
    {
      "$lookup": {
        "from": "staff_attendance_tracking",
        "let": { "userId": "$_id" },
        "pipeline": [
          {
            "$match": {
              "$expr": {
                "$and": [
                  { "$eq": ["$staffId", "$$userId"] },
                  { "$gte": ["$date", { "$dateFromString": { "dateString": "2025-12-23T00:00:00+05:00" } }] },
                  { "$lt": ["$date", { "$dateFromString": { "dateString": "2025-12-24T00:00:00+05:00" } }] }
                ]
              }
            }
          }
        ],
        "as": "attendance"
      }
    },
    {
      "$match": {
        "$or": [
          { "attendance": { "$size": 0 } },
          { "attendance.0.actualStart": { "$gte": { "$dateFromString": { "dateString": "2025-12-23T09:00:00+05:00" } } } }
        ]
      }
    },
    { "$project": { "fullName": 1, "role": 1, "phone": 1 } }
  ]
}
```

### Получить количество детей по группам

```json
{
  "collection": "children",
  "operation": "aggregate",
  "pipeline": [
    { "$match": { "active": true } },
    {
      "$lookup": {
        "from": "groups",
        "localField": "groupId",
        "foreignField": "_id",
        "as": "group"
      }
    },
    { "$unwind": "$group" },
    {
      "$group": {
        "_id": "$group.name",
        "count": { "$sum": 1 }
      }
    }
  ]
}
```

### Сотрудники с днём рождения в этом месяце

```json
{
  "collection": "users",
  "operation": "aggregate",
  "pipeline": [
    { "$match": { "active": true, "birthday": { "$exists": true } } },
    {
      "$addFields": {
        "birthMonth": { "$month": "$birthday" }
      }
    },
    { "$match": { "birthMonth": 12 } },
    { "$project": { "fullName": 1, "birthday": 1, "role": 1 } }
  ]
}
```
