# API Documentation

## Authentication

### Register
- **POST** `/auth/register`
- **Description**: Register a new user
- **Headers**: None
- **Body**:
 ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "string" (optional, default: "teacher")
  }
 ```
- **Response**:
 ```json
  {
    "message": "Пользователь успешно зарегистрирован",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string"
    },
    "token": "string"
  }
  ```
- **Errors**:
  - 400: User with this email or username already exists

### Login
- **POST** `/auth/login`
- **Description**: Authenticate user and return token
- **Headers**: None
- **Body**:
 ```json
  {
    "email": "string",
    "password": "string"
  }
 ```
- **Response**:
  ```json
  {
    "message": "Успешный вход",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string"
    },
    "token": "string"
  }
  ```
- **Errors**:
  - 401: Invalid credentials or user deactivated

### Get Profile
- **GET** `/auth/profile`
- **Description**: Get current user profile
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean"
    }
  }
  ```
- **Errors**:
  - 401: Unauthorized
  - 404: User not found

### Update Profile
- **PUT** `/auth/profile`
- **Description**: Update current user profile
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string"
  }
  ```
- **Response**:
 ```json
  {
    "message": "Профиль успешно обновлен",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean"
    }
  }
  ```
- **Errors**:
  - 400: Bad request
 - 401: Unauthorized

### Change Password
- **PUT** `/auth/change-password`
- **Description**: Change current user password
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Пароль успешно изменен"
  }
  ```
- **Errors**:
  - 400: Bad request
 - 401: Unauthorized

### Get All Users (Admin only)
- **GET** `/auth/users`
- **Description**: Get all users (admin only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "users": [
      {
        "id": "string",
        "username": "string",
        "email": "string",
        "role": "string",
        "isActive": "boolean",
        "createdAt": "date"
      }
    ]
 }
  ```
- **Errors**:
  - 401: Unauthorized
  - 403: Forbidden (not admin)

### Toggle User Status (Admin only)
- **PATCH** `/auth/users/toggle-status`
- **Description**: Activate/deactivate user (admin only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
  ```json
  {
    "userId": "string",
    "isActive": "boolean"
  }
 ```
- **Response**:
  ```json
  {
    "message": "Статус пользователя активирован/деактивирован",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean"
    }
  }
  ```
- **Errors**:
  - 400: Bad request
  - 401: Unauthorized
  - 403: Forbidden (not admin)

## Users

### Get Users
- **GET** `/users`
- **Description**: Get list of users with pagination and filters
- **Headers**: 
  - Authorization: Bearer {token}
- **Query Parameters**:
  - page: number (optional, default: 1)
  - limit: number (optional, default: 10)
  - role: string (optional)
  - active: boolean (optional)
  - groupId: string (optional)
- **Response**:
 ```json
  {
    "users": [...],
    "total": number,
    "page": number,
    "limit": number
  }
  ```

### Get User by ID
- **GET** `/users/:id`
- **Description**: Get user by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**:
  ```json
  {
    "id": "string",
    "fullName": "string",
    "phone": "string",
    "role": "string",
    "active": "boolean",
    "groupId": "string"
  }
  ```

### Create User
- **POST** `/users`
- **Description**: Create new user (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: User data
- **Response**: Created user object

### Update User
- **PUT** `/users/:id`
- **Description**: Update user (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated user object

### Delete User
- **DELETE** `/users/:id`
- **Description**: Delete user (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: 204 No Content

### Toggle User Active Status
- **PUT** `/users/:id/toggle-active`
- **Description**: Activate/deactivate user
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
 ```json
  {
    "active": "boolean"
 }
  ```
- **Response**: Updated user object

## Finance

### Get Finances
- **GET** `/finance`
- **Description**: Get list of financial operations
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of finance objects

### Get Finance by ID
- **GET** `/finance/:id`
- **Description**: Get financial operation by ID
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Finance object

### Create Finance
- **POST** `/finance`
- **Description**: Create new financial operation (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: Finance data
- **Response**: Created finance object

### Update Finance
- **PUT** `/finance/:id`
- **Description**: Update financial operation (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Updated finance object

### Delete Finance
- **DELETE** `/finance/:id`
- **Description**: Delete financial operation (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Success boolean

### Approve Finance
- **POST** `/finance/:id/approve`
- **Description**: Approve financial operation (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Updated finance object

### Cancel Finance
- **POST** `/finance/:id/cancel`
- **Description**: Cancel financial operation (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body** (optional):
 ```json
 {
    "reason": "string"
  }
  ```
- **Response**: Updated finance object

## Groups

### Get Groups
- **GET** `/groups`
- **Description**: Get list of groups
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of group objects

### Get Group by ID
- **GET** `/groups/:id`
- **Description**: Get group by ID
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Group object

### Create Group
- **POST** `/groups`
- **Description**: Create new group (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Group data
- **Response**: Created group object

### Update Group
- **PUT** `/groups/:id`
- **Description**: Update group (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated group object

### Delete Group
- **DELETE** `/groups/:id`
- **Description**: Delete group (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Success boolean

### Get Groups by Teacher ID
- **GET** `/groups/teacher/:teacherId`
- **Description**: Get groups by teacher ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of group objects

## Children

### Get Children
- **GET** `/children`
- **Description**: Get list of children
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of child objects

### Get Child by ID
- **GET** `/children/:id`
- **Description**: Get child by ID
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Child object

### Create Child
- **POST** `/children`
- **Description**: Create new child (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Child data
- **Response**: Created child object

### Update Child
- **PUT** `/children/:id`
- **Description**: Update child (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated child object

### Delete Child
- **DELETE** `/children/:id`
- **Description**: Delete child (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Success boolean

## Documents

### Get Documents
- **GET** `/documents`
- **Description**: Get list of documents
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Array of document objects

### Get Document by ID
- **GET** `/documents/:id`
- **Description**: Get document by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Document object

### Create Document
- **POST** `/documents`
- **Description**: Create new document (admin/manager/teacher/nurse only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Document data
- **Response**: Created document object

### Update Document
- **PUT** `/documents/:id`
- **Description**: Update document (admin/manager/teacher/nurse only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated document object

### Delete Document
- **DELETE** `/documents/:id`
- **Description**: Delete document (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Success boolean

## Time Tracking

### Get Time Entries
- **GET** `/time-tracking`
- **Description**: Get time entries (admin/manager/teacher only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Array of time entry objects

## Shifts

### Get Shifts
- **GET** `/shifts`
- **Description**: Get list of shifts
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of shift objects

### Get Shift by ID
- **GET** `/shifts/:id`
- **Description**: Get shift by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Shift object

### Create Shift
- **POST** `/shifts`
- **Description**: Create new shift (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Shift data
- **Response**: Created shift object

### Update Shift
- **PUT** `/shifts/:id`
- **Description**: Update shift (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated shift object

### Delete Shift
- **DELETE** `/shifts/:id`
- **Description**: Delete shift (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Success boolean

## Reports

### Get Reports
- **GET** `/reports`
- **Description**: Get list of reports
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Array of report objects

### Get Report by ID
- **GET** `/reports/:id`
- **Description**: Get report by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Report object

### Create Report
- **POST** `/reports`
- **Description**: Create new report (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: Report data
- **Response**: Created report object

### Update Report
- **PUT** `/reports/:id`
- **Description**: Update report (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated report object

### Delete Report
- **DELETE** `/reports/:id`
- **Description**: Delete report (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Success boolean

### Execute Report
- **POST** `/reports/:id/execute`
- **Description**: Execute report (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Execution result

## Task Lists

### Get Task Lists
- **GET** `/task-lists`
- **Description**: Get list of task lists
- **Headers**: 
 - Authorization: Bearer {token}
- **Query Parameters**:
  - assignedTo: string (optional)
  - status: string (optional)
  - priority: string (optional)
  - category: string (optional)
- **Response**: Array of task list objects

### Get User Task Lists
- **GET** `/task-lists/my`
- **Description**: Get task lists assigned to current user
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of task list objects

### Get Task List Statistics
- **GET** `/task-lists/statistics`
- **Description**: Get task list statistics (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Statistics object

### Get Task List by ID
- **GET** `/task-lists/:id`
- **Description**: Get task list by ID
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Task list object

### Create Task List
- **POST** `/task-lists`
- **Description**: Create new task list (admin/manager/teacher only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: Task list data
- **Response**: Created task list object

### Update Task List
- **PUT** `/task-lists/:id`
- **Description**: Update task list (admin/manager/teacher only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated task list object

### Delete Task List
- **DELETE** `/task-lists/:id`
- **Description**: Delete task list (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Success boolean

### Add Task to List
- **POST** `/task-lists/:id/tasks`
- **Description**: Add new task to task list (admin/manager/teacher only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Task data
- **Response**: Updated task list object

### Update Task Status
- **PUT** `/task-lists/:taskListId/tasks/:taskId`
- **Description**: Update task status in task list (admin/manager/teacher/assistant only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
  ```json
  {
    "completed": "boolean"
  }
  ```
- **Response**: Updated task list object

### Remove Task from List
- **DELETE** `/task-lists/:taskListId/tasks/:taskId`
- **Description**: Remove task from task list (admin/manager/teacher only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated task list object

## Attendance

### Get Child Attendances
- **GET** `/attendance`
- **Description**: Get list of child attendances
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of attendance objects

### Get Child Attendance by ID
- **GET** `/attendance/:id`
- **Description**: Get child attendance by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Attendance object

### Create Child Attendance
- **POST** `/attendance`
- **Description**: Create new child attendance (admin/manager/teacher only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Body**: Attendance data
- **Response**: Created attendance object

### Update Child Attendance
- **PUT** `/attendance/:id`
- **Description**: Update child attendance (admin/manager/teacher only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Updated attendance object

### Delete Child Attendance
- **DELETE** `/attendance/:id`
- **Description**: Delete child attendance (admin/manager only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Success boolean

## Settings

### Get Settings
- **GET** `/settings`
- **Description**: Get all settings
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Settings object

### Get Setting by Key
- **GET** `/settings/key/:key`
- **Description**: Get setting by key
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Setting object

### Set Setting
- **POST** `/settings/key/:key`
- **Description**: Set setting value (admin/manager only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**:
  ```json
  {
    "value": "any"
  }
  ```
- **Response**: Updated setting object

## Menu

### Get Menu Items
- **GET** `/menu/items`
- **Description**: Get menu items
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of menu items

### Get Menu Item by ID
- **GET** `/menu/items/:id`
- **Description**: Get menu item by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Menu item object

### Create Menu Item
- **POST** `/menu/items`
- **Description**: Create new menu item (admin/manager/cook only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: Menu item data
- **Response**: Created menu item object

### Update Menu Item
- **PUT** `/menu/items/:id`
- **Description**: Update menu item (admin/manager/cook only)
- **Headers**: 
 - Authorization: Bearer {token}
- **Response**: Updated menu item object

### Delete Menu Item
- **DELETE** `/menu/items/:id`
- **Description**: Delete menu item (admin/manager/cook only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Success boolean

## Medical

### Get Health Passports
- **GET** `/medical/health-passports`
- **Description**: Get health passports
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Array of health passport objects

### Get Health Passport by ID
- **GET** `/medical/health-passports/:id`
- **Description**: Get health passport by ID
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Health passport object

### Create Health Passport
- **POST** `/medical/health-passports`
- **Description**: Create new health passport (admin/manager/doctor/nurse only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Body**: Health passport data
- **Response**: Created health passport object

### Update Health Passport
- **PUT** `/medical/health-passports/:id`
- **Description**: Update health passport (admin/manager/doctor/nurse only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Updated health passport object

### Delete Health Passport
- **DELETE** `/medical/health-passports/:id`
- **Description**: Delete health passport (admin/manager/doctor/nurse only)
- **Headers**: 
  - Authorization: Bearer {token}
- **Response**: Success boolean