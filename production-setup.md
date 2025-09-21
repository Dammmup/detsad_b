# Production Setup Guide - Детский сад CRM

## 🚀 Подготовка к production

### 1. Переменные окружения (.env)

Создайте файл `.env` в корне backend проекта:

```bash
# Основные настройки
NODE_ENV=production
PORT=8080

# MongoDB
MONGODB_URI=mongodb://localhost:27017/detsad_crm

# JWT Secret - КРИТИЧЕСКИ ВАЖНО!
# Сгенерируйте случайную строку длиной минимум 32 символа
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars-min


# CORS настройки
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Генерация JWT_SECRET

Выполните одну из команд для генерации безопасного секрета:

```bash
# Способ 1: OpenSSL
openssl rand -base64 32

# Способ 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Способ 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Настройка MongoDB

```bash
# Установка MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install -y mongodb

# Запуск MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Создание базы данных и пользователя
mongo
> use detsad_crm
> db.createUser({
    user: "detsad_user",
    pwd: "secure_password_here",
    roles: ["readWrite"]
})
```

### 4. Настройка PM2 для production

```bash
# Установка PM2
npm install -g pm2

# Создание ecosystem файла
```

Создайте `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'detsad-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 5. Сборка и запуск

```bash
# Сборка TypeScript
npm run build

# Запуск через PM2
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

### 6. Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### 7. SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Мониторинг и логи

```bash
# Просмотр логов PM2
pm2 logs detsad-backend

# Мониторинг
pm2 monit

# Перезапуск при изменениях
pm2 restart detsad-backend
```

### 9. Безопасность

1. **Firewall:**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

2. **Обновления системы:**
```bash
sudo apt update && sudo apt upgrade -y
```

3. **Резервное копирование MongoDB:**
```bash
# Создание бэкапа
mongodump --db detsad_crm --out /backup/$(date +%Y%m%d)

# Восстановление
mongorestore --db detsad_crm /backup/20240101/detsad_crm/
```

### 11. Проверка готовности

- [ ] JWT_SECRET установлен и безопасен
- [ ] MongoDB настроена и защищена
- [ ] SSL сертификат установлен
- [ ] PM2 настроен и работает
- [ ] Nginx проксирует запросы
- [ ] Логи настроены
- [ ] Резервное копирование настроено
- [ ] Firewall настроен

## 🎉 Готово к production!

После выполнения всех шагов ваш детский сад CRM готов к работе в production среде.
