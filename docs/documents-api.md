# API Документов

## Обзор

Этот API предоставляет функционал для управления документами в системе детского сада, включая создание, чтение, обновление, удаление и экспорт документов, а также управление шаблонами документов.

## Базовый URL

```
/documents
```

## Аутентификация

Все endpoints требуют аутентификации с помощью JWT токена. Токен должен быть передан в заголовке `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## Документы

### Получение списка документов

```
GET /documents
```

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| type | string | Тип документа (contract, certificate, report, policy, other) |
| category | string | Категория документа (staff, children, financial, administrative, other) |
| status | string | Статус документа (active, archived) |
| relatedId | string | ID связанного объекта |
| relatedType | string | Тип связанного объекта (staff, child, group) |
| search | string | Поиск по названию, описанию, тегам |
| page | integer | Номер страницы (по умолчанию 1) |
| limit | integer | Количество элементов на странице (по умолчанию 20) |

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "string",
      "category": "string",
      "fileName": "string",
      "fileSize": "number",
      "filePath": "string",
      "uploadDate": "date",
      "uploader": {
        "id": "string",
        "fullName": "string",
        "email": "string"
      },
      "relatedId": "string",
      "relatedType": "string",
      "status": "string",
      "tags": ["string"],
      "version": "string",
      "expiryDate": "date",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "integer",
    "limit": "integer",
    "total": "integer",
    "pages": "integer"
  }
}
```

### Получение конкретного документа

```
GET /documents/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "uploadDate": "date",
    "uploader": {
      "id": "string",
      "fullName": "string",
      "email": "string"
    },
    "relatedId": "string",
    "relatedType": "string",
    "status": "string",
    "tags": ["string"],
    "version": "string",
    "expiryDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Создание документа

```
POST /documents
```

#### Тело запроса (multipart/form-data)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| file | file | Да | Файл документа |
| title | string | Да | Название документа |
| description | string | Нет | Описание документа |
| type | string | Да | Тип документа |
| category | string | Да | Категория документа |
| relatedId | string | Нет | ID связанного объекта |
| relatedType | string | Нет | Тип связанного объекта |
| tags | array | Нет | Теги документа |
| expiryDate | date | Нет | Дата истечения срока действия |
| version | string | Нет | Версия документа |

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "uploadDate": "date",
    "uploader": {
      "id": "string",
      "fullName": "string",
      "email": "string"
    },
    "relatedId": "string",
    "relatedType": "string",
    "status": "string",
    "tags": ["string"],
    "version": "string",
    "expiryDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "message": "Документ успешно создан"
}
```

### Обновление документа

```
PUT /documents/:id
```

#### Тело запроса (application/json)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| title | string | Нет | Название документа |
| description | string | Нет | Описание документа |
| type | string | Нет | Тип документа |
| category | string | Нет | Категория документа |
| relatedId | string | Нет | ID связанного объекта |
| relatedType | string | Нет | Тип связанного объекта |
| tags | array | Нет | Теги документа |
| expiryDate | date | Нет | Дата истечения срока действия |
| version | string | Нет | Версия документа |
| status | string | Нет | Статус документа |

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "uploadDate": "date",
    "uploader": {
      "id": "string",
      "fullName": "string",
      "email": "string"
    },
    "relatedId": "string",
    "relatedType": "string",
    "status": "string",
    "tags": ["string"],
    "version": "string",
    "expiryDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "message": "Документ успешно обновлен"
}
```

### Удаление документа

```
DELETE /documents/:id
```

#### Ответ

```json
{
  "success": true,
  "message": "Документ успешно удален"
}
```

### Скачивание документа

```
GET /documents/:id/download
```

#### Ответ

Файл документа для скачивания.

## Шаблоны документов

### Получение списка шаблонов документов

```
GET /documents/templates
```

#### Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| type | string | Тип шаблона (contract, certificate, report, policy, other) |
| category | string | Категория шаблона (staff, children, financial, administrative, other) |
| isActive | boolean | Активность шаблона |
| search | string | Поиск по названию, описанию, тегам |
| page | integer | Номер страницы (по умолчанию 1) |
| limit | integer | Количество элементов на странице (по умолчанию 20) |

#### Ответ

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "category": "string",
      "fileName": "string",
      "fileSize": "number",
      "filePath": "string",
      "version": "string",
      "isActive": "boolean",
      "tags": ["string"],
      "usageCount": "number",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {
    "page": "integer",
    "limit": "integer",
    "total": "integer",
    "pages": "integer"
  }
}
```

### Получение конкретного шаблона документа

```
GET /documents/templates/:id
```

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "version": "string",
    "isActive": "boolean",
    "tags": ["string"],
    "usageCount": "number",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Создание шаблона документа

```
POST /documents/templates
```

#### Тело запроса (multipart/form-data)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| file | file | Да | Файл шаблона |
| name | string | Да | Название шаблона |
| description | string | Нет | Описание шаблона |
| type | string | Да | Тип шаблона |
| category | string | Да | Категория шаблона |
| tags | array | Нет | Теги шаблона |
| version | string | Нет | Версия шаблона |
| isActive | boolean | Нет | Активность шаблона (по умолчанию true) |

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "version": "string",
    "isActive": "boolean",
    "tags": ["string"],
    "usageCount": "number",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "message": "Шаблон документа успешно создан"
}
```

### Обновление шаблона документа

```
PUT /documents/templates/:id
```

#### Тело запроса (application/json)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| name | string | Нет | Название шаблона |
| description | string | Нет | Описание шаблона |
| type | string | Нет | Тип шаблона |
| category | string | Нет | Категория шаблона |
| tags | array | Нет | Теги шаблона |
| version | string | Нет | Версия шаблона |
| isActive | boolean | Нет | Активность шаблона |

#### Ответ

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "fileName": "string",
    "fileSize": "number",
    "filePath": "string",
    "version": "string",
    "isActive": "boolean",
    "tags": ["string"],
    "usageCount": "number",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "message": "Шаблон документа успешно обновлен"
}
```

### Удаление шаблона документа

```
DELETE /documents/templates/:id
```

#### Ответ

```json
{
  "success": true,
  "message": "Шаблон документа успешно удален"
}
```

### Скачивание шаблона документа

```
GET /documents/templates/:id/download
```

#### Ответ

Файл шаблона для скачивания.

## Экспорт документов

### Экспорт списка документов

```
POST /documents/export
```

#### Тело запроса (application/json)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| format | string | Да | Формат экспорта (pdf, excel, csv) |
| type | string | Нет | Тип документов для экспорта |
| category | string | Нет | Категория документов для экспорта |
| status | string | Нет | Статус документов для экспорта |
| startDate | date | Нет | Начальная дата |
| endDate | date | Нет | Конечная дата |

#### Ответ

Файл экспорта для скачивания.

### Экспорт списка шаблонов документов

```
POST /documents/templates/export
```

#### Тело запроса (application/json)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| format | string | Да | Формат экспорта (pdf, excel, csv) |
| type | string | Нет | Тип шаблонов для экспорта |
| category | string | Нет | Категория шаблонов для экспорта |
| isActive | boolean | Нет | Активность шаблонов для экспорта |

#### Ответ

Файл экспорта для скачивания.

## Ошибки

API может возвращать следующие коды ошибок:

| Код | Сообщение | Описание |
|-----|-----------|----------|
| 400 | Bad Request | Неверный запрос |
| 401 | Unauthorized | Неавторизованный доступ |
| 403 | Forbidden | Доступ запрещен |
| 404 | Not Found | Ресурс не найден |
| 500 | Internal Server Error | Внутренняя ошибка сервера |

## Примеры использования

### Получение списка документов сотрудников

```javascript
// Получение всех активных документов сотрудников
fetch('/documents?type=contract&category=staff&status=active', {
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Создание нового документа

```javascript
// Создание нового документа
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'Трудовой договор Иванова И.И.');
formData.append('type', 'contract');
formData.append('category', 'staff');
formData.append('relatedId', 'user123');
formData.append('relatedType', 'staff');

fetch('/documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Экспорт документов в Excel

```javascript
// Экспорт документов в Excel
fetch('/documents/export', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'excel',
    type: 'contract',
    category: 'staff',
    startDate: '2025-09-01',
    endDate: '2025-09-30'
  })
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'documents_export.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
});